package metaprotocol

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
)

type InscriptionMetadata struct {
	Parent struct {
		Type       string `json:"type"`
		Identifier string `json:"identifier"`
	} `json:"parent"`
	Metadata struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Mime        string `json:"mime"`
	} `json:"metadata"`
}

type Inscription struct {
}

func NewInscriptionProcessor() *Inscription {
	return &Inscription{}
}

func (i *Inscription) Name() string {
	return "Inscription"
}

func (i *Inscription) Process(protocolData string, metadata []byte, data []byte) ([]interface{}, error) {
	var dataModels []interface{}

	// protocolData for an inscription looks like the following
	// {chainId}=content@{unique hash of content}
	chainParts := strings.Split(protocolData, "=")
	if len(chainParts) != 2 {
		return dataModels, fmt.Errorf("invalid protocol data: %s", protocolData)
	}

	chainID := chainParts[0]
	contentParts := strings.Split(chainParts[1], "@")
	if len(contentParts) != 2 {
		return dataModels, fmt.Errorf("invalid protocol data: %s", protocolData)
	}

	switch contentParts[0] {
	case "content":
		// TODO: Handle content
	case "multipart":
		// TODO: Handle multipart
	case "summary":
		// TODO: Handle summary for multipart content inscriptions
	default:
		return dataModels, fmt.Errorf("invalid protocol data: %s", protocolData)
	}

	contentHash := contentParts[1]

	var inscriptionMetadata InscriptionMetadata
	err := json.Unmarshal(metadata, &inscriptionMetadata)
	if err != nil {
		return dataModels, err
	}

	fmt.Println("Got chainID: ", chainID)
	fmt.Println("Got hash: ", contentHash)
	fmt.Println("Got metadata: ", string(metadata))
	fmt.Println("Got parent: ", inscriptionMetadata.Parent.Type)
	fmt.Println("Got name: ", inscriptionMetadata.Metadata.Name)
	fmt.Println("Got mime: ", inscriptionMetadata.Metadata.Mime)
	fmt.Println("Got byte length: ", len(data))

	contentBase64 := base64.StdEncoding.EncodeToString(data)

	dataModels = append(dataModels, models.Inscription{
		Height:         1000,
		Hash:           contentHash,
		Creator:        "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5",
		Owner:          "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5",
		Parent:         "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5",
		Type:           "content",
		MetadataBase64: string(metadata),
		ContentBase64:  contentBase64,
		ContentPath:    "content",
		DateCreated:    time.Now(),
	})

	fmt.Println("Retuirn interface model")

	return dataModels, nil
}

func (i *Inscription) processContent(content []byte) error {
	return nil
}
