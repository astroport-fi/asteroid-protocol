package metaprotocol

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/nsfw"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type InscriptionConfig struct {
	S3Endpoint string `envconfig:"S3_ENDPOINT" required:"true"`
	S3Region   string `envconfig:"S3_REGION" required:"true"`
	S3Bucket   string `envconfig:"S3_BUCKET"`
	S3ID       string `envconfig:"S3_ID" required:"true"`
	S3Secret   string `envconfig:"S3_SECRET" required:"true"`
	S3Token    string `envconfig:"S3_TOKEN"`
}

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
	chainID    string
	db         *gorm.DB
	nsfwWorker *nsfw.Worker
	s3Endpoint string
	s3Region   string
	s3Bucket   string
	// s3ID is the S3 credentials ID
	s3ID string
	// s3Secret is the S3 credentials secret
	s3Secret string
	// s3Token is the S3 credentials token
	s3Token string
}

func NewInscriptionProcessor(chainID string, db *gorm.DB, nsfwWorker *nsfw.Worker) *Inscription {

	// Parse config environment variables for self
	var config InscriptionConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &Inscription{
		chainID:    chainID,
		db:         db,
		nsfwWorker: nsfwWorker,
		s3Endpoint: config.S3Endpoint,
		s3Region:   config.S3Region,
		s3Bucket:   config.S3Bucket,
		s3ID:       config.S3ID,
		s3Secret:   config.S3Secret,
		s3Token:    config.S3Token,
	}
}

func (protocol *Inscription) Name() string {
	return "Inscription"
}

func (protocol *Inscription) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
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

	// TODO: Rework validation
	if parsedURN.KeyValuePairs["h"] == "" {
		return fmt.Errorf("missing content hash")
	}
	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("invalid chain ID '%s'", parsedURN.ChainID)
	}

	switch parsedURN.Operation {
	case "inscribe":
		contentHash := parsedURN.KeyValuePairs["h"]

		// Inscription metadata is stored in the non_critical_extension_options
		// section of the transaction
		var metadata []byte
		var content []byte
		for _, extension := range rawTransaction.Body.NonCriticalExtensionOptions {
			// The type of the option must be MsgRevoke
			if extension.Type == "/cosmos.authz.v1beta1.MsgRevoke" {
				// The granter field contains the metadata
				metadata, err = base64.StdEncoding.DecodeString(extension.Granter)
				if err != nil {
					return fmt.Errorf("unable to decode granter metadata '%s'", err)
				}

				// The grantee field contains the content base64
				content, err = base64.StdEncoding.DecodeString(extension.Grantee)
				if err != nil {
					return fmt.Errorf("unable to decode grantee content '%s'", err)
				}

				// We only process the first extension option
				break
			}
		}

		var inscriptionMetadata InscriptionMetadata
		err = json.Unmarshal(metadata, &inscriptionMetadata)
		if err != nil {
			return fmt.Errorf("unable to unmarshal metadata '%s'", err)
		}

		// Store the content with the correct mime type on DO
		contentPath, err := protocol.storeContent(inscriptionMetadata, rawTransaction.Hash, content)
		if err != nil {
			return fmt.Errorf("unable to store content '%s'", err)
		}

		// check if content is explicit
		isExplicit := <-protocol.nsfwWorker.Add(content)

		inscriptionModel := models.Inscription{
			ChainID:          parsedURN.ChainID,
			Height:           transactionModel.Height,
			Version:          parsedURN.Version,
			TransactionID:    transactionModel.ID,
			ContentHash:      contentHash,
			Creator:          sender,
			CurrentOwner:     sender,
			Type:             "content",
			Metadata:         datatypes.JSON(metadata),
			ContentPath:      contentPath,
			ContentSizeBytes: uint64(len(content)),
			IsExplicit:       isExplicit,
			DateCreated:      transactionModel.DateCreated,
		}

		result := protocol.db.Save(&inscriptionModel)
		if result.Error != nil {
			return result.Error
		}

		inscriptionHistory := models.InscriptionHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			InscriptionID: inscriptionModel.ID,
			Sender:        "asteroids",
			Receiver:      sender,
			Action:        "inscribe",
			DateCreated:   transactionModel.DateCreated,
		}
		// If we fail to save history, that's fine
		protocol.db.Save(&inscriptionHistory)

	case "transfer":
		txHash := parsedURN.KeyValuePairs["h"]

		// Fetch transaction from database with the given hash
		var transaction models.Transaction
		result := protocol.db.Where("hash = ?", txHash).First(&transaction)
		if result.Error != nil {
			// Invalid hash
			return result.Error
		}

		// Fetch the inscription for this transaction ID
		var inscription models.Inscription
		result = protocol.db.Where("transaction_id = ?", transaction.ID).First(&inscription)
		if result.Error != nil {
			// Invalid transaction ID
			return result.Error
		}

		// Check that the sender is the current owner
		if inscription.CurrentOwner != sender {
			return fmt.Errorf("invalid sender, must be current owner")
		}

		// All good, transfer
		destinationAddress := strings.TrimSpace(parsedURN.KeyValuePairs["dst"])
		destinationAddress = strings.ToLower(destinationAddress)
		inscription.CurrentOwner = destinationAddress
		result = protocol.db.Save(&inscription)
		if result.Error != nil {
			return fmt.Errorf("unable to update inscription owner '%s'", result.Error)
		}

		inscriptionHistory := models.InscriptionHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			InscriptionID: inscription.ID,
			Sender:        sender,
			Receiver:      destinationAddress,
			Action:        "transfer",
			DateCreated:   transactionModel.DateCreated,
		}
		// If we fail to save history, that's fine
		protocol.db.Save(&inscriptionHistory)
	}
	return nil
}

// storeContent stores the content in the S3 bucket
func (protocol *Inscription) storeContent(metadata InscriptionMetadata, txHash string, content []byte) (string, error) {
	ext, err := mime.ExtensionsByType(metadata.Metadata.Mime)
	if err != nil {
		// We could not find the mime type, so we default to .bin
		ext = []string{".bin"}
	}
	if len(ext) == 0 {
		// We could not find the mime type, so we default to .bin
		ext = []string{".bin"}
	}
	// The mimetype gives us ".markdown" as extension when it should be .md
	if ext[0] == ".markdown" {
		ext[0] = ".md"
	}

	endpoint := protocol.s3Endpoint
	region := protocol.s3Region
	sess := session.Must(session.NewSession(&aws.Config{
		Endpoint:    &endpoint,
		Region:      &region,
		Credentials: credentials.NewStaticCredentials(protocol.s3ID, protocol.s3Secret, protocol.s3Token),
	}))

	// Create an uploader with the session and default options
	uploader := s3manager.NewUploader(sess)

	// Upload the file to an S3 compatible bucket
	myBucket := protocol.s3Bucket
	filename := txHash + ext[0]
	uploadResult, err := uploader.Upload(&s3manager.UploadInput{
		ACL:         aws.String("public-read"),
		Bucket:      aws.String(myBucket),
		Key:         aws.String(filename),
		Body:        bytes.NewReader(content),
		ContentType: aws.String(metadata.Metadata.Mime),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file, %v", err)
	}

	return aws.StringValue(&uploadResult.Location), nil
}
