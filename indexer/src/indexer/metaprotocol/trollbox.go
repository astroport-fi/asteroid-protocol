package metaprotocol

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type TrollBox struct {
	chainID     string
	db          *gorm.DB
	inscription *Inscription
	launchpad   *Launchpad
}

type TrollBoxConfig struct {
}

func NewTrollBoxProcessor(chainID string, db *gorm.DB, inscription *Inscription, launchpad *Launchpad) *TrollBox {
	// Parse config environment variables for self
	var config TrollBoxConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &TrollBox{
		chainID:     chainID,
		db:          db,
		inscription: inscription,
		launchpad:   launchpad,
	}
}

func (protocol *TrollBox) Name() string {
	return "TrollBox"
}

func (protocol *TrollBox) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction, sourceChannel string) error {
	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return err
	}

	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return err
	}

	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("invalid chain ID '%s'", parsedURN.ChainID)
	}

	switch parsedURN.Operation {
	case "post":
		return protocol.Post(transactionModel, parsedURN, rawTransaction, sender)
	case "collect":
		return protocol.Collect(transactionModel, parsedURN, rawTransaction, sender)
	}
	return nil
}

func (protocol *TrollBox) Collect(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	if parsedURN.KeyValuePairs["h"] == "" {
		return fmt.Errorf("missing post hash")
	}

	// find troll post for hash
	postHash := parsedURN.KeyValuePairs["h"]

	var transaction models.Transaction
	result := protocol.db.Where("hash = ?", postHash).First(&transaction)
	if result.Error != nil {
		// Invalid hash
		return result.Error
	}

	// get the troll post
	var trollPost models.TrollPost
	result = protocol.db.Where("transaction_id = ?", transaction.ID).First(&trollPost)
	if result.Error != nil {
		return fmt.Errorf("troll post not found")
	}

	// check if collection for this post already exists
	symbol := fmt.Sprintf("TROLL:%d", trollPost.ID)
	var collection models.Collection
	result = protocol.db.Where("symbol = ?", symbol).First(&collection)
	if result.Error != nil {
		if result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		// prepare name
		name := fmt.Sprintf("Troll %d", trollPost.ID)

		// prepare metadata
		collectionMetadata := types.InscriptionMetadata[types.CollectionMetadata]{
			Parent: types.InscriptionMetadataParent{
				Type:       "/cosmos.bank.Account",
				Identifier: trollPost.Creator,
			},
			Metadata: types.CollectionMetadata{
				Description: trollPost.Text,
			},
		}
		// metadata to json
		metadataBytes, err := json.Marshal(collectionMetadata)
		if err != nil {
			return fmt.Errorf("unable to marshal metadata '%s'", err)
		}

		// create collection
		collection = models.Collection{
			ChainID:          parsedURN.ChainID,
			Height:           trollPost.Height,
			Version:          "v2",
			TransactionID:    trollPost.TransactionID,
			Creator:          trollPost.Creator,
			Symbol:           symbol,
			Name:             name,
			ContentHash:      trollPost.ContentHash,
			ContentSizeBytes: trollPost.ContentSizeBytes,
			ContentPath:      trollPost.ContentPath,
			Metadata:         datatypes.JSON(metadataBytes),
			DateCreated:      trollPost.DateCreated,
		}

		result = protocol.db.Save(&collection)
		if result.Error != nil {
			return result.Error
		}

		// create launchpad with one stage
		launchpad := models.Launchpad{
			ChainID:           parsedURN.ChainID,
			Height:            trollPost.Height,
			Version:           "v2",
			TransactionID:     trollPost.TransactionID,
			MaxSupply:         100,
			MintedSupply:      0,
			CollectionID:      collection.ID,
			DateCreated:       trollPost.DateCreated,
			RevealImmediately: true,
		}

		result = protocol.db.Save(&launchpad)
		if result.Error != nil {
			return result.Error
		}

		// create stage
		stage := models.LaunchpadStage{
			CollectionID: collection.ID,
			LaunchpadID:  launchpad.ID,
			Price:        100000,
			HasWhitelist: false,
		}

		result = protocol.db.Save(&stage)
		if result.Error != nil {
			return result.Error
		}
	}

	// create a mint reservation
	protocol.launchpad.ReserveInscriptionInternal(transactionModel, rawTransaction, sender, collection.TransactionID, 0, 1)

	return nil
}

func (protocol *TrollBox) Post(transactionModel models.Transaction, parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	if parsedURN.KeyValuePairs["h"] == "" {
		return fmt.Errorf("missing content hash")
	}

	contentHash := parsedURN.KeyValuePairs["h"]

	// get trollbox metadata and data from non_critical_extension_options
	msg, err := rawTransaction.Body.GetExtensionMessage()
	if err != nil {
		return err
	}

	var trollBoxMetadata types.TrollBoxMetadata
	jsonBytes, err := msg.GetMetadataBytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonBytes, &trollBoxMetadata)
	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// store the content with the correct mime type on DO
	content, err := msg.GetContent()
	if err != nil {
		return err
	}

	contentPath, err := protocol.inscription.StoreContent(trollBoxMetadata.Mime, rawTransaction.Hash, content)
	if err != nil {
		return fmt.Errorf("unable to store content '%s'", err)
	}

	// Get the max id
	var maxID uint64
	err = protocol.db.Model(&models.TrollPost{}).Select("MAX(id)").Scan(&maxID).Error
	if err != nil {
		return err
	}
	postID := maxID + 1

	// save to db
	trollPost := models.TrollPost{
		ID:               postID,
		ChainID:          parsedURN.ChainID,
		Height:           transactionModel.Height,
		Version:          parsedURN.Version,
		TransactionID:    transactionModel.ID,
		ContentHash:      contentHash,
		Creator:          sender,
		Text:             trollBoxMetadata.Text,
		ContentPath:      contentPath,
		ContentSizeBytes: uint64(len(content)),
		DateCreated:      transactionModel.DateCreated,
	}

	result := protocol.db.Save(&trollPost)
	if result.Error != nil {
		return result.Error
	}

	return nil
}
