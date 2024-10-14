package metaprotocol

import (
	"bytes"
	"database/sql"
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
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/worker"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type InscriptionConfig struct {
	S3Endpoint       string `envconfig:"S3_ENDPOINT"`
	S3Region         string `envconfig:"S3_REGION"`
	S3Bucket         string `envconfig:"S3_BUCKET"`
	S3ID             string `envconfig:"S3_ID"`
	S3Secret         string `envconfig:"S3_SECRET"`
	S3Token          string `envconfig:"S3_TOKEN"`
	ReservationsFile string `envconfig:"RESERVATIONS_FILE" required:"true"`
	S3StoreContent   bool   `envconfig:"S3_STORE_CONTENT" default:"true"`
	MinterBotAddress string `envconfig:"MINTER_BOT_ADDRESS" required:"true"`
}

type Inscription struct {
	chainID      string
	db           *gorm.DB
	workerClient *worker.WorkerClient
	s3Endpoint   string
	s3Region     string
	s3Bucket     string
	// s3ID is the S3 credentials ID
	s3ID string
	// s3Secret is the S3 credentials secret
	s3Secret string
	// s3Token is the S3 credentials token
	s3Token              string
	reservationsByName   map[string]CollectionReservation
	reservationsByTicker map[string]CollectionReservation
	MinterBotAddress     string
}

func NewInscriptionProcessor(chainID string, db *gorm.DB, workerClient *worker.WorkerClient) *Inscription {
	// Parse config environment variables for self
	var config InscriptionConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	if config.S3StoreContent && (config.S3Endpoint == "" || config.S3Region == "" || config.S3Bucket == "" || config.S3ID == "" || config.S3Secret == "") {
		log.Fatalf("S3 store content is enabled but the required environment variables are not set")
	}

	// load reservations
	reservationsByName, reservationsByTicker := GetReservations(config.ReservationsFile)

	return &Inscription{
		chainID:              chainID,
		db:                   db,
		s3Endpoint:           config.S3Endpoint,
		s3Region:             config.S3Region,
		s3Bucket:             config.S3Bucket,
		s3ID:                 config.S3ID,
		s3Secret:             config.S3Secret,
		s3Token:              config.S3Token,
		reservationsByName:   reservationsByName,
		reservationsByTicker: reservationsByTicker,
		workerClient:         workerClient,
		MinterBotAddress:     config.MinterBotAddress,
	}
}

func (protocol *Inscription) Name() string {
	return "Inscription"
}

func (protocol *Inscription) GetCollection(collectionHash string, sender string, checkSenderIsOwner bool) (*models.Collection, error) {
	// Fetch transaction from database with the given hash
	var transaction models.Transaction
	result := protocol.db.Where("hash = ?", collectionHash).First(&transaction)
	if result.Error != nil {
		// Invalid hash
		return nil, result.Error
	}

	// Fetch the collection for this transaction ID
	var collection models.Collection
	result = protocol.db.Where("transaction_id = ?", transaction.ID).First(&collection)
	if result.Error != nil {
		// Invalid transaction ID
		return nil, result.Error
	}

	// Check that the sender is the collection owner
	if checkSenderIsOwner && collection.Creator != sender {
		return nil, fmt.Errorf("invalid sender, must be collection owner")
	}

	return &collection, nil
}

func (protocol *Inscription) GetInscriptionFromHash(inscriptionHash string) (*models.Inscription, error) {
	// Fetch transaction from database with the given hash
	var transaction models.Transaction
	result := protocol.db.Where("hash = ?", inscriptionHash).First(&transaction)
	if result.Error != nil {
		// Invalid hash
		return nil, result.Error
	}

	// Fetch the inscription for this transaction ID
	var inscription models.Inscription
	result = protocol.db.Where("transaction_id = ?", transaction.ID).First(&inscription)
	if result.Error != nil {
		// Invalid transaction ID
		return nil, result.Error
	}

	return &inscription, nil
}

func (protocol *Inscription) GetInscription(inscriptionHash string, sender string) (*models.Inscription, error) {
	inscription, err := protocol.GetInscriptionFromHash(inscriptionHash)
	if err != nil {
		return nil, err
	}

	// Check that the sender is the current owner
	if inscription.CurrentOwner != sender {
		return nil, fmt.Errorf("invalid sender, must be current owner")
	}

	return inscription, nil
}

func (protocol *Inscription) GrantMigrationPermission(transactionModel models.Transaction, inscriptionHash string, grantee string, granter string) error {
	// Fetch the inscription for this transaction ID
	inscription, err := protocol.GetInscriptionFromHash(inscriptionHash)
	if err != nil {
		return err
	}

	// Check that the sender is the inscription creator
	if inscription.Creator != granter {
		return fmt.Errorf("invalid granter, must be inscription creator")
	}

	// Check if the grantee has already been granted migration permission
	var migrationPermissionGrant models.MigrationPermissionGrant
	result := protocol.db.Where("inscription_id = ? AND grantee = ?", inscription.ID, grantee).First(&migrationPermissionGrant)
	if result.Error == nil {
		return fmt.Errorf("migration permission already granted")
	}

	// Grant migration permission
	migrationPermissionGrant = models.MigrationPermissionGrant{
		InscriptionID: inscription.ID,
		Granter:       granter,
		Grantee:       grantee,
		DateCreated:   transactionModel.DateCreated,
	}
	result = protocol.db.Save(&migrationPermissionGrant)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (protocol *Inscription) UpdateCollection(parsedURN ProtocolURN, rawTransaction types.RawTransaction, sender string) error {
	// validate collection hash
	if parsedURN.KeyValuePairs["h"] == "" {
		return fmt.Errorf("missing collection hash")
	}

	collectionHash := parsedURN.KeyValuePairs["h"]

	// get collection
	collection, err := protocol.GetCollection(collectionHash, sender, true)
	if err != nil {
		return err
	}

	// get collection metadata from non_critical_extension_options
	msg, err := rawTransaction.Body.GetExtensionMessage()
	if err != nil {
		return err
	}

	var updateMetadata types.CollectionMetadata
	jsonBytes, err := msg.GetMetadataBytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonBytes, &updateMetadata)
	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// update collection metadata
	var currentMetadata types.InscriptionMetadata[types.CollectionMetadata]
	err = json.Unmarshal(collection.Metadata, &currentMetadata)

	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	if updateMetadata.RoyaltyPercentage != 0 {
		currentMetadata.Metadata.RoyaltyPercentage = updateMetadata.RoyaltyPercentage
		collection.RoyaltyPercentage = sql.NullFloat64{Float64: float64(updateMetadata.RoyaltyPercentage), Valid: true}
	}

	if updateMetadata.PaymentAddress != "" {
		if err := ValidateCosmosAddress(updateMetadata.PaymentAddress); err != nil {
			return err
		}

		currentMetadata.Metadata.PaymentAddress = updateMetadata.PaymentAddress
		collection.PaymentAddress = sql.NullString{String: updateMetadata.PaymentAddress, Valid: true}
	}

	if updateMetadata.Description != "" {
		currentMetadata.Metadata.Description = updateMetadata.Description
	}

	if updateMetadata.Twitter != "" {
		currentMetadata.Metadata.Twitter = updateMetadata.Twitter
	}

	if updateMetadata.Telegram != "" {
		currentMetadata.Metadata.Telegram = updateMetadata.Telegram
	}

	if updateMetadata.Discord != "" {
		currentMetadata.Metadata.Discord = updateMetadata.Discord
	}

	if updateMetadata.Website != "" {
		currentMetadata.Metadata.Website = updateMetadata.Website
	}

	metadataBytes, err := json.Marshal(currentMetadata)
	if err != nil {
		return fmt.Errorf("unable to marshal collection metadata '%s'", err)
	}

	collection.Metadata = datatypes.JSON(metadataBytes)
	protocol.db.Save(&collection)

	return nil
}

func (protocol *Inscription) Migrate(rawTransaction types.RawTransaction, sender string) error {
	// get migration data from non_critical_extension_options
	var msg types.ExtensionMsg
	var err error
	for _, extension := range rawTransaction.Body.NonCriticalExtensionOptions {
		msg, err = extension.UnmarshalData()
		if err != nil {
			return fmt.Errorf("unable to unmarshal extension data '%s'", err)
		}

		// We only process the first extension option
		break
	}

	if msg == nil {
		return fmt.Errorf("no extension options found")
	}

	var migrationData types.InscriptionMigrationData
	jsonBytes, err := msg.GetMetadataBytes()
	if err != nil {
		return err
	}

	err = json.Unmarshal(jsonBytes, &migrationData)
	if err != nil {
		return fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// get collection
	var collection *models.Collection
	if migrationData.Collection != "" {
		collection, err = protocol.GetCollection(migrationData.Collection, sender, true)
		if err != nil {
			return err
		}
	}

	// iterate over the rows and migrate the inscriptions
	// verify that the sender is the inscription owner
	attributeNames := migrationData.Header[1:]

	err = protocol.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range migrationData.Rows {
			// get the inscription
			inscriptionHash := row[0]
			inscription, err := protocol.GetInscriptionFromHash(inscriptionHash)
			if err != nil {
				return err
			}

			// Check that the sender is the inscription creator or has migration permissions
			if inscription.Creator != sender {
				// Check if the sender has migration permissions
				var migrationPermissionGrant models.MigrationPermissionGrant
				result := protocol.db.Where("inscription_id = ? AND grantee = ?", inscription.ID, sender).First(&migrationPermissionGrant)
				if result.Error != nil {
					// Invalid migration permission
					return fmt.Errorf("invalid sender, must be creator or have migration permissions")
				}
				inscription.Creator = sender
			}

			// check if the inscription is already migrated
			if inscription.CollectionID.Valid || (inscription.Version != "v1" && collection == nil) {
				return fmt.Errorf("inscription already migrated")
			}

			// update inscription metadata
			traits := types.GetTraits(attributeNames, row[1:])
			var metadata types.InscriptionNftMetadata
			err = json.Unmarshal(inscription.Metadata, &metadata)
			if err != nil {
				return fmt.Errorf("unable to unmarshal metadata '%s'", err)
			}
			metadata.Metadata.Attributes = traits
			metadataBytes, err := json.Marshal(metadata)
			if err != nil {
				return fmt.Errorf("unable to marshal metadata '%s'", err)
			}

			inscription.Metadata = datatypes.JSON(metadataBytes)

			// update inscription collection
			if collection != nil {
				inscription.CollectionID = sql.NullInt64{Int64: int64(collection.ID), Valid: true}
			}

			// update inscription version
			inscription.Version = "v2"

			// save updated inscription
			result := tx.Save(&inscription)
			if result.Error != nil {
				return result.Error
			}
		}
		return nil
	})

	if err != nil {
		return err
	}

	// update collection stats and traits
	if collection != nil {
		protocol.workerClient.UpdateCollectionStats(collection.ID)
		protocol.workerClient.UpdateCollectionTraits(collection.ID)
	}

	return nil
}

func (protocol *Inscription) RequiresV2(version string) error {
	if version != "v2" {
		return fmt.Errorf("requires v2 version of the inscription protocol")
	}
	return nil

}

func (protocol *Inscription) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction, sourceChannel string) error {
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
	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("invalid chain ID '%s'", parsedURN.ChainID)
	}

	switch parsedURN.Operation {
	case "inscribe":
		if parsedURN.KeyValuePairs["h"] == "" {
			return fmt.Errorf("missing content hash")
		}

		contentHash := parsedURN.KeyValuePairs["h"]

		// Inscription metadata is stored in the non_critical_extension_options
		// section of the transaction
		var msg types.ExtensionMsg
		for _, extension := range rawTransaction.Body.NonCriticalExtensionOptions {
			msg, err = extension.UnmarshalData()
			if err != nil {
				return fmt.Errorf("unable to unmarshal extension data '%s'", err)
			}

			// We only process the first extension option
			break
		}

		var inscriptionMetadata types.InscriptionMetadata[types.NftMetadata]
		jsonBytes, err := msg.GetMetadata(&inscriptionMetadata)
		if err != nil {
			return err
		}

		// If inscription has attributes require v2
		if len(inscriptionMetadata.Metadata.Attributes) > 0 {
			if err := protocol.RequiresV2(parsedURN.Version); err != nil {
				return err
			}
		}

		var collectionMetadata types.InscriptionMetadata[types.CollectionMetadata]
		err = json.Unmarshal(jsonBytes, &collectionMetadata)
		if err != nil {
			return fmt.Errorf("unable to unmarshal metadata '%s'", err)
		}

		content, err := msg.GetContent()
		if err != nil {
			return err
		}

		// Check if the content hash is already in the database
		var contentPath string
		var contentAlreadyExists bool = false
		var inscription models.Inscription
		result := protocol.db.Where("content_hash = ?", contentHash).First(&inscription)
		if result.Error == nil {
			// Content hash already exists
			contentPath = inscription.ContentPath
			contentAlreadyExists = true
		} else if result.Error != gorm.ErrRecordNotFound {
			// Error fetching content hash
			return result.Error
		} else {
			// Store the content with the correct mime type on DO
			contentPath, err = protocol.StoreContent(inscriptionMetadata.Metadata.Mime, rawTransaction.Hash, content)
			if err != nil {
				return fmt.Errorf("unable to store content '%s'", err)
			}
		}

		// Check if the inscription is a Collection
		if collectionMetadata.Metadata.Symbol != "" {
			if err := protocol.RequiresV2(parsedURN.Version); err != nil {
				return err
			}

			symbol := strings.ToUpper(collectionMetadata.Metadata.Symbol)

			// check if symbol is reserved
			if reservation, ok := protocol.reservationsByTicker[symbol]; ok {
				if reservation.Address != sender {
					return fmt.Errorf("ticker '%s' is reserved", symbol)
				}
			}

			// check if name is reserved
			if reservation, ok := protocol.reservationsByName[collectionMetadata.Metadata.Name]; ok {
				if reservation.Address != sender {
					return fmt.Errorf("name '%s' is reserved", collectionMetadata.Metadata.Name)
				}
			}

			collectionModel := models.Collection{
				ChainID:          parsedURN.ChainID,
				Height:           transactionModel.Height,
				Version:          parsedURN.Version,
				TransactionID:    transactionModel.ID,
				ContentHash:      contentHash,
				Creator:          sender,
				Name:             collectionMetadata.Metadata.Name,
				Symbol:           symbol,
				Metadata:         datatypes.JSON(jsonBytes),
				ContentPath:      contentPath,
				ContentSizeBytes: uint64(len(content)),
				DateCreated:      transactionModel.DateCreated,
			}

			if collectionMetadata.Metadata.Minter != "" {
				collectionModel.Minter = sql.NullString{String: collectionMetadata.Metadata.Minter, Valid: true}
			}
			if collectionMetadata.Metadata.RoyaltyPercentage != 0 {
				collectionModel.RoyaltyPercentage = sql.NullFloat64{Float64: float64(collectionMetadata.Metadata.RoyaltyPercentage), Valid: true}
			}
			if collectionMetadata.Metadata.PaymentAddress != "" {
				collectionModel.PaymentAddress = sql.NullString{String: collectionMetadata.Metadata.PaymentAddress, Valid: true}
			}

			result := protocol.db.Save(&collectionModel)
			if result.Error != nil {
				return result.Error
			}
			return nil
		}

		// Get the max inscription number
		var maxInscriptionNumber uint64
		err = protocol.db.Model(&models.Inscription{}).Select("MAX(inscription_number)").Scan(&maxInscriptionNumber).Error
		if err != nil {
			return err
		}
		inscriptionNumber := maxInscriptionNumber + 1

		inscriptionModel := models.Inscription{
			InscriptionNumber: inscriptionNumber,
			ChainID:           parsedURN.ChainID,
			Height:            transactionModel.Height,
			Version:           parsedURN.Version,
			TransactionID:     transactionModel.ID,
			ContentHash:       contentHash,
			Creator:           sender,
			CurrentOwner:      sender,
			Type:              "content",
			Metadata:          datatypes.JSON(jsonBytes),
			ContentPath:       contentPath,
			ContentSizeBytes:  uint64(len(content)),
			DateCreated:       transactionModel.DateCreated,
		}

		// Check if inscription is part of a Collection
		if inscriptionMetadata.Parent.Type == "/collection" {
			if err := protocol.RequiresV2(parsedURN.Version); err != nil {
				return err
			}

			collection, err := protocol.GetCollection(inscriptionMetadata.Parent.Identifier, sender, false)

			// check sender has launchpad mint reservation or is collection owner
			var launchpad models.Launchpad
			result := protocol.db.Where("collection_id = ?", collection.ID).First(&launchpad)
			if result.Error != nil {
				if result.Error != gorm.ErrRecordNotFound {
					return result.Error
				}

				if collection.Creator != sender {
					return fmt.Errorf("invalid sender, must have launchpad mint reservation or be collection owner")
				}
			} else {
				// if sender is creator and launchpad is not launched yet, allow to pre-mint
				if collection.Creator == sender && launchpad.StartDate.Valid && launchpad.StartDate.Time.After(transactionModel.DateCreated) {
					// update minted supply
					launchpad.MintedSupply += 1
					result = protocol.db.Save(&launchpad)
					if result.Error != nil {
						return result.Error
					}
				} else {
					var reservation models.LaunchpadMintReservation
					result := protocol.db.Where("collection_id = ? and address = ? and is_minted = ?", collection.ID, sender, false).First(&reservation)
					if result.Error != nil {
						return fmt.Errorf("invalid sender, must have launchpad mint reservation or be collection owner")
					}

					// check inscribe tx was executed by minter bot
					if rawTransaction.Body.Messages[0].Grantee != protocol.MinterBotAddress {
						return fmt.Errorf("invalid sender, must be minter bot")
					}

					// mark reservation as minted
					reservation.IsMinted = true

					result = protocol.db.Save(&reservation)
					if result.Error != nil {
						return result.Error
					}
				}

				// set token_id to inscription
				inscriptionModel.TokenID = sql.NullInt64{Int64: int64(inscriptionMetadata.Metadata.TokenID), Valid: true}

				// allow multiple inscriptions with the same content hash
				if contentAlreadyExists {
					inscriptionModel.ContentHash = fmt.Sprintf("%s-%d", contentHash, inscriptionMetadata.Metadata.TokenID)
				}

			}

			if err != nil {
				return fmt.Errorf("error getting collection with identifier '%s': %w", inscriptionMetadata.Parent.Identifier, err)
			}

			// set collection id to the inscription
			inscriptionModel.CollectionID = sql.NullInt64{Int64: int64(collection.ID), Valid: true}
			inscriptionModel.Creator = collection.Creator
		}

		// insert inscription to DB
		result = protocol.db.Save(&inscriptionModel)
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

		if inscriptionModel.CollectionID.Valid {
			protocol.workerClient.UpdateCollectionStats(uint64(inscriptionModel.CollectionID.Int64))
			protocol.workerClient.UpdateCollectionTraits(uint64(inscriptionModel.CollectionID.Int64))
		}

	case "transfer":
		if parsedURN.KeyValuePairs["h"] == "" {
			return fmt.Errorf("missing content hash")
		}

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
	case "migrate":
		if err := protocol.RequiresV2(parsedURN.Version); err != nil {
			return err
		}

		return protocol.Migrate(rawTransaction, sender)
	case "update-collection":
		if err := protocol.RequiresV2(parsedURN.Version); err != nil {
			return err
		}

		return protocol.UpdateCollection(parsedURN, rawTransaction, sender)
	case "grant-migration-permission":
		if err := protocol.RequiresV2(parsedURN.Version); err != nil {
			return err
		}

		if parsedURN.KeyValuePairs["h"] == "" {
			return fmt.Errorf("missing inscription hash")
		}

		if parsedURN.KeyValuePairs["grantee"] == "" {
			return fmt.Errorf("missing grantee")
		}

		inscriptionHash := parsedURN.KeyValuePairs["h"]
		grantee := strings.TrimSpace(parsedURN.KeyValuePairs["grantee"])

		return protocol.GrantMigrationPermission(transactionModel, inscriptionHash, grantee, sender)
	}
	return nil
}

// storeContent stores the content in the S3 bucket
func (protocol *Inscription) StoreContent(mimeType string, txHash string, content []byte) (string, error) {
	if protocol.s3Endpoint == "" {
		return "", nil
	}

	ext, err := mime.ExtensionsByType(mimeType)
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
		ContentType: aws.String(mimeType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file, %v", err)
	}

	return aws.StringValue(&uploadResult.Location), nil
}
