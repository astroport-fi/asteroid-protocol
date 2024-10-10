package metaprotocol

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"slices"
	"strconv"
	"strings"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Launchpad struct {
	chainID        string
	db             *gorm.DB
	inscription    *Inscription
	Allowlist      []string
	MintingEnabled bool
}

type LaunchpadConfig struct {
	Allowlist      []string `envconfig:"LAUNCHPAD_ALLOWLIST"`
	MintingEnabled bool     `envconfig:"LAUNCHPAD_MINTING_ENABLED" default:"false"`
}

func NewLaunchpadProcessor(chainID string, db *gorm.DB, inscription *Inscription) *Launchpad {
	// Parse config environment variables for self
	var config LaunchpadConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &Launchpad{
		chainID:        chainID,
		db:             db,
		inscription:    inscription,
		Allowlist:      config.Allowlist,
		MintingEnabled: config.MintingEnabled,
	}
}

func (protocol *Launchpad) Name() string {
	return "Launchpad"
}

func (protocol *Launchpad) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction, sourceChannel string) error {
	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return err
	}

	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;inscribe$h=c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf
	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return err
	}

	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("invalid chain ID '%s'", parsedURN.ChainID)
	}

	switch parsedURN.Operation {
	case "launch":
		return protocol.LaunchCollection(transactionModel, parsedURN, rawTransaction, sender)
	case "reserve":
		return protocol.ReserveInscription(transactionModel, parsedURN, rawTransaction, sender)
	case "update":
		return protocol.UpdateLaunch(transactionModel, parsedURN, rawTransaction, sender)
	}
	return nil
}

func (protocol *Launchpad) ReserveInscriptionInternal(transactionModel models.Transaction, rawTransaction types.RawTransaction, sender string, launchpadTransactionID uint64, stageID uint64, amount uint64) error {
	var launchpad models.Launchpad
	result := protocol.db.Where("transaction_id = ?", launchpadTransactionID).First(&launchpad)
	if result.Error != nil {
		return fmt.Errorf("launchpad not found")
	}

	// get stage
	var stage models.LaunchpadStage
	if stageID == 0 {
		// get first stage
		result = protocol.db.Where("launchpad_id = ?", launchpad.ID).First(&stage)
	} else {
		result = protocol.db.Where("launchpad_id = ? AND id = ?", launchpad.ID, stageID).First(&stage)

	}
	if result.Error != nil {
		return fmt.Errorf("stage not found")
	}

	// check supply
	if launchpad.MaxSupply > 0 && launchpad.MintedSupply >= launchpad.MaxSupply {
		return fmt.Errorf("launchpad minted out")
	}
	var amountToMint uint64
	if launchpad.MaxSupply > 0 {
		amountToMint = min(amount, launchpad.MaxSupply-launchpad.MintedSupply)
	} else {
		amountToMint = amount
	}

	// check if stage is active
	if stage.StartDate.Valid && stage.StartDate.Time.After(transactionModel.DateCreated) {
		return fmt.Errorf("stage not active yet")
	}

	if stage.FinishDate.Valid && stage.FinishDate.Time.Before(transactionModel.DateCreated) {
		return fmt.Errorf("stage already finished")
	}

	// check if user is whitelisted
	if stage.HasWhitelist {
		var count int64
		protocol.db.Model(&models.LaunchpadWhitelist{}).Where("launchpad_id = ? AND stage_id = ? AND address = ?", launchpad.ID, stage.ID, sender).Count(&count)
		if count == 0 {
			return fmt.Errorf("user not whitelisted")
		}
	}

	// check per user limit
	if stage.PerUserLimit > 0 {
		var count int64
		protocol.db.Model(&models.LaunchpadMintReservation{}).Where("launchpad_id = ? AND stage_id = ? AND address = ?", launchpad.ID, stage.ID, sender).Count(&count)
		if count >= stage.PerUserLimit {
			return fmt.Errorf("user reached per user limit")
		}
		amountToMint = min(amountToMint, uint64(stage.PerUserLimit)-uint64(count))
	}

	// @todo check user send enough funds to pay for mint and fee

	// get token id
	var maxTokenId uint64
	err := protocol.db.Model(&models.LaunchpadMintReservation{}).Select("COALESCE(MAX(token_id), 0)").Where("launchpad_id = ?", launchpad.ID).Scan(&maxTokenId).Error
	if err != nil {
		return err
	}

	// get metadata
	// get launch metadata from non_critical_extension_options
	msg, err := rawTransaction.Body.GetExtensionMessage()
	var metadataBytes []byte
	if err == nil {
		metadataBytes, err = msg.GetMetadataBytes()
		if err != nil {
			return err
		}
	}

	if amountToMint < 1 {
		return fmt.Errorf("nothing to mint")
	}

	for i := uint64(0); i < amountToMint; i++ {
		tokenId := maxTokenId + i + 1

		// save to db
		reservation := models.LaunchpadMintReservation{
			CollectionID: launchpad.CollectionID,
			LaunchpadID:  launchpad.ID,
			StageID:      stage.ID,
			Address:      sender,
			TokenId:      tokenId,
			DateCreated:  transactionModel.DateCreated,
			IsRandom:     launchpad.MaxSupply > 0,
		}
		if metadataBytes != nil {
			reservation.Metadata = datatypes.JSON(metadataBytes)
		}

		result = protocol.db.Save(&reservation)

		if result.Error != nil {
			return result.Error
		}

		// update minted supply
		launchpad.MintedSupply += 1
		result = protocol.db.Save(&launchpad)
		if result.Error != nil {
			return result.Error
		}

	}

	return nil
}

func (protocol *Launchpad) ReserveInscription(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	if !protocol.MintingEnabled {
		return fmt.Errorf("minting is disabled")
	}

	// validate launchpad hash
	launchpadHash := parsedURN.KeyValuePairs["h"]
	if launchpadHash == "" {
		return fmt.Errorf("missing launchpad hash")
	}

	// validate stage id
	stageIDString := parsedURN.KeyValuePairs["stg"]
	if parsedURN.KeyValuePairs["stg"] == "" {
		return fmt.Errorf("missing stage id")
	}
	stageID, err := strconv.ParseUint(stageIDString, 10, 64)
	if err != nil {
		return fmt.Errorf("unable to parse stage id '%s'", err)
	}

	// Check required fields
	amountString := strings.TrimSpace(parsedURN.KeyValuePairs["amt"])
	// Convert amount to have the correct number of decimals
	amount, err := strconv.ParseUint(amountString, 10, 64)
	if err != nil {
		return fmt.Errorf("unable to parse amount '%s'", err)
	}
	if amount <= 0 {
		amount = 1
	}

	// @todo check signature

	// get launchpad
	// Fetch transaction from database with the given hash
	var transaction models.Transaction
	result := protocol.db.Where("hash = ?", launchpadHash).First(&transaction)
	if result.Error != nil {
		// Invalid hash
		return result.Error
	}

	return protocol.ReserveInscriptionInternal(transactionModel, rawTransaction, sender, transaction.ID, stageID, amount)
}

func (protocol *Launchpad) UpdateLaunch(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	// check if sender is allowed to update
	if !protocol.MintingEnabled && !slices.Contains(protocol.Allowlist, sender) {
		return fmt.Errorf("sender not allowed to update")
	}

	// validate collection hash
	collectionHash := parsedURN.KeyValuePairs["h"]
	if collectionHash == "" {
		return fmt.Errorf("missing collection hash")
	}

	// get collection
	collection, err := protocol.inscription.GetCollection(collectionHash, sender, true)
	if err != nil {
		return err
	}

	// get launchpad
	var launchpad models.Launchpad
	result := protocol.db.Where("collection_id = ?", collection.ID).First(&launchpad)
	if result.Error != nil {
		return fmt.Errorf("launchpad not found")
	}

	// not allowed to update if launchpad is started
	if !launchpad.StartDate.Valid || launchpad.StartDate.Time.Before(transactionModel.DateCreated) {
		return fmt.Errorf("launchpad already started")
	}

	// get launch metadata from non_critical_extension_options
	msg, err := rawTransaction.Body.GetExtensionMessage()
	if err != nil {
		return err
	}

	var launchMetadata types.LaunchMetadata
	jsonBytes, err := msg.GetMetadataBytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonBytes, &launchMetadata)
	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// get start and finish launchpad dates from stages
	startDate, finishDate := protocol.calculateLaunchWindow(launchMetadata)

	// update launchpad
	launchpad.MaxSupply = launchMetadata.Supply
	launchpad.StartDate = startDate
	launchpad.FinishDate = finishDate
	launchpad.RevealImmediately = launchMetadata.RevealImmediately

	if !launchMetadata.RevealDate.IsZero() {
		launchpad.RevealDate = sql.NullTime{Time: launchMetadata.RevealDate, Valid: true}
	}

	result = protocol.db.Save(&launchpad)
	if result.Error != nil {
		return result.Error
	}

	// update stages
	for i, stage := range launchMetadata.Stages {
		// get stage
		var launchpadStage models.LaunchpadStage
		if stage.ID == 0 {
			launchpadStage = models.LaunchpadStage{
				CollectionID: collection.ID,
				LaunchpadID:  launchpad.ID,
			}
		} else {
			result := protocol.db.Where("launchpad_id = ? AND id = ?", launchpad.ID, stage.ID).First(&launchpadStage)
			if result.Error != nil {
				return fmt.Errorf("stage not found")
			}
		}

		launchpadStage.Price = stage.Price
		launchpadStage.PerUserLimit = stage.MaxPerUser
		launchpadStage.HasWhitelist = len(stage.Whitelist) > 0

		if stage.Name != "" {
			launchpadStage.Name = sql.NullString{String: stage.Name, Valid: true}
		}

		if stage.Description != "" {
			launchpadStage.Description = sql.NullString{String: stage.Description, Valid: true}
		}

		if stage.Start.IsZero() {
			launchpadStage.StartDate = sql.NullTime{Valid: false}
		} else {
			launchpadStage.StartDate = sql.NullTime{Time: stage.Start, Valid: true}
		}

		if stage.Finish.IsZero() {
			launchpadStage.FinishDate = sql.NullTime{Valid: false}
		} else {
			launchpadStage.FinishDate = sql.NullTime{Time: stage.Finish, Valid: true}
		}

		result = protocol.db.Save(&launchpadStage)
		if result.Error != nil {
			return result.Error
		}

		launchMetadata.Stages[i].ID = launchpadStage.ID

		// update whitelists
		// delete all existing whitelists
		result = protocol.db.Where("launchpad_id = ? AND stage_id = ?", launchpad.ID, launchpadStage.ID).Delete(&models.LaunchpadWhitelist{})
		if result.Error != nil {
			return result.Error
		}

		// save new whitelists
		for _, whitelist := range stage.Whitelist {
			launchpadWhitelist := models.LaunchpadWhitelist{
				CollectionID: collection.ID,
				LaunchpadID:  launchpad.ID,
				StageID:      launchpadStage.ID,
				Address:      whitelist,
			}

			result := protocol.db.Save(&launchpadWhitelist)
			if result.Error != nil {
				return result.Error
			}
		}
	}

	// delete stage if not in metadata
	var stages []models.LaunchpadStage
	result = protocol.db.Where("launchpad_id = ?", launchpad.ID).Find(&stages)
	if result.Error != nil {
		return result.Error
	}

	for _, stage := range stages {
		found := false
		for _, newStage := range launchMetadata.Stages {
			if stage.ID == newStage.ID {
				found = true
				break
			}
		}

		if !found {
			result = protocol.db.Delete(&stage)
			if result.Error != nil {
				return result.Error
			}
		}
	}

	return nil
}

func (protocol *Launchpad) LaunchCollection(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	// check if sender is allowed to launch
	if !protocol.MintingEnabled && !slices.Contains(protocol.Allowlist, sender) {
		return fmt.Errorf("sender not allowed to launch")
	}

	// validate collection hash
	if parsedURN.KeyValuePairs["h"] == "" {
		return fmt.Errorf("missing collection hash")
	}

	collectionHash := parsedURN.KeyValuePairs["h"]

	// get collection
	collection, err := protocol.inscription.GetCollection(collectionHash, sender, true)
	if err != nil {
		return err
	}

	// check if collection doesn't already have a launchpad or inscriptions
	var launchpad models.Launchpad
	result := protocol.db.Where("collection_id = ?", collection.ID).First(&launchpad)
	if result.Error == nil {
		return fmt.Errorf("collection already has a launchpad")
	}

	var count int64
	protocol.db.Model(&models.Inscription{}).Where("collection_id = ?", collection.ID).Count(&count)
	if count > 0 {
		return fmt.Errorf("collection already has inscriptions")
	}

	// get launch metadata from non_critical_extension_options
	msg, err := rawTransaction.Body.GetExtensionMessage()
	if err != nil {
		return err
	}

	var launchMetadata types.LaunchMetadata
	jsonBytes, err := msg.GetMetadataBytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonBytes, &launchMetadata)
	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// get start and finish launchpad dates from stages
	startDate, finishDate := protocol.calculateLaunchWindow(launchMetadata)

	// save to db
	launchpad = models.Launchpad{
		ChainID:           parsedURN.ChainID,
		Height:            transactionModel.Height,
		TransactionID:     transactionModel.ID,
		Version:           parsedURN.Version,
		CollectionID:      collection.ID,
		DateCreated:       transactionModel.DateCreated,
		MaxSupply:         launchMetadata.Supply,
		MintedSupply:      0,
		StartDate:         startDate,
		FinishDate:        finishDate,
		RevealImmediately: launchMetadata.RevealImmediately,
	}

	if !launchMetadata.RevealDate.IsZero() {
		launchpad.RevealDate = sql.NullTime{Time: launchMetadata.RevealDate, Valid: true}
	}

	result = protocol.db.Save(&launchpad)
	if result.Error != nil {
		return result.Error
	}

	// save stages
	for _, stage := range launchMetadata.Stages {
		launchpadStage := models.LaunchpadStage{
			CollectionID: collection.ID,
			LaunchpadID:  launchpad.ID,
			Price:        stage.Price,
			PerUserLimit: stage.MaxPerUser,
			HasWhitelist: len(stage.Whitelist) > 0,
		}

		if stage.Name != "" {
			launchpadStage.Name = sql.NullString{String: stage.Name, Valid: true}
		}

		if stage.Description != "" {
			launchpadStage.Description = sql.NullString{String: stage.Description, Valid: true}
		}

		if !stage.Start.IsZero() {
			launchpadStage.StartDate = sql.NullTime{Time: stage.Start, Valid: true}
		}

		if !stage.Finish.IsZero() {
			launchpadStage.FinishDate = sql.NullTime{Time: stage.Finish, Valid: true}
		}

		result := protocol.db.Save(&launchpadStage)
		if result.Error != nil {
			return result.Error
		}

		// save whitelists
		for _, whitelist := range stage.Whitelist {
			launchpadWhitelist := models.LaunchpadWhitelist{
				CollectionID: collection.ID,
				LaunchpadID:  launchpad.ID,
				StageID:      launchpadStage.ID,
				Address:      whitelist,
			}

			result := protocol.db.Save(&launchpadWhitelist)
			if result.Error != nil {
				return result.Error
			}
		}
	}

	return nil
}

func (*Launchpad) calculateLaunchWindow(launchMetadata types.LaunchMetadata) (sql.NullTime, sql.NullTime) {
	var startDate, finishDate sql.NullTime
	var startsNow bool = false
	var isInfinite bool = false

	for _, stage := range launchMetadata.Stages {
		if stage.Start.IsZero() {
			startsNow = true
			startDate = sql.NullTime{Valid: false}
		} else if !startsNow {
			if !startDate.Valid || stage.Start.Before(startDate.Time) {
				startDate = sql.NullTime{Time: stage.Start, Valid: true}
			}
		}

		if stage.Finish.IsZero() {
			isInfinite = true
			finishDate = sql.NullTime{Valid: false}
		} else if !isInfinite {
			if !finishDate.Valid || stage.Finish.After(finishDate.Time) {
				finishDate = sql.NullTime{Time: stage.Finish, Valid: true}
			}
		}
	}
	return startDate, finishDate
}
