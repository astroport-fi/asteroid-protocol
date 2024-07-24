package metaprotocol

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type Launchpad struct {
	chainID     string
	db          *gorm.DB
	inscription *Inscription
}

func NewLaunchpadProcessor(chainID string, db *gorm.DB, inscription *Inscription) *Launchpad {
	return &Launchpad{
		chainID:     chainID,
		db:          db,
		inscription: inscription,
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
	}
	return nil
}

func (protocol *Launchpad) ReserveInscription(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	// validate launchpad hash
	launchpadHash := parsedURN.KeyValuePairs["h"]
	if launchpadHash == "" {
		return fmt.Errorf("missing launchpad hash")
	}

	// validate stage id
	stageID := parsedURN.KeyValuePairs["stg"]
	if parsedURN.KeyValuePairs["stg"] == "" {
		return fmt.Errorf("missing stage id")
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

	var launchpad models.Launchpad
	result = protocol.db.Where("transaction_id = ?", transaction.ID).First(&launchpad)
	if result.Error != nil {
		return fmt.Errorf("launchpad not found")
	}

	// get stage
	var stage models.LaunchpadStage
	result = protocol.db.Where("launchpad_id = ? AND id = ?", launchpad.ID, stageID).First(&stage)
	if result.Error != nil {
		return fmt.Errorf("stage not found")
	}

	// check supply
	if launchpad.MaxSupply > 0 && launchpad.MintedSupply >= launchpad.MaxSupply {
		return fmt.Errorf("launchpad minted out")
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
	}

	// @todo check user send enough funds to pay for mint and fee

	// get token id
	var maxTokenId uint64
	err := protocol.db.Model(&models.LaunchpadMintReservation{}).Select("COALESCE(MAX(token_id), 0)").Scan(&maxTokenId).Error
	if err != nil {
		return err
	}
	tokenId := maxTokenId + 1

	// save to db
	reservation := models.LaunchpadMintReservation{
		CollectionID: launchpad.CollectionID,
		LaunchpadID:  launchpad.ID,
		StageID:      stage.ID,
		Address:      sender,
		TokenId:      tokenId,
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

	return nil
}

func (protocol *Launchpad) LaunchCollection(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
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
	var startDate, finishDate sql.NullTime
	for _, stage := range launchMetadata.Stages {
		if !stage.Start.IsZero() {
			if !startDate.Valid || stage.Start.Before(startDate.Time) {
				startDate = sql.NullTime{Time: stage.Start, Valid: true}
			}
		}

		if !stage.Finish.IsZero() {
			if !finishDate.Valid || stage.Finish.After(finishDate.Time) {
				finishDate = sql.NullTime{Time: stage.Finish, Valid: true}
			}
		}
	}

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
