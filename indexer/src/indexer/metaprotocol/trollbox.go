package metaprotocol

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
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
	}
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

	// save to db
	trollPost := models.TrollPost{
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
