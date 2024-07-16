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
	collection, err := protocol.inscription.GetCollection(collectionHash, sender)
	if err != nil {
		return err
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

	// save to db
	launchpad := models.Launchpad{
		ChainID:       parsedURN.ChainID,
		Height:        transactionModel.Height,
		TransactionID: transactionModel.ID,
		Version:       parsedURN.Version,
		CollectionID:  collection.ID,
		DateCreated:   transactionModel.DateCreated,
		MaxSupply:     launchMetadata.Supply,
	}
	result := protocol.db.Save(&launchpad)
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
