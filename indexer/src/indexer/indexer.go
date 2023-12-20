package indexer

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/metaprotocol"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/leodido/go-urn"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Indexer implements the reference indexer service
type Indexer struct {
	chainID                  string
	lcdEndpoint              string
	blockPollIntervalSeconds int
	logger                   *logrus.Entry

	metaprotocols map[string]metaprotocol.Processor

	stopChannel chan bool
	db          *gorm.DB
	wg          sync.WaitGroup
}

// New returns a new instance of the indexer service and returns an error if
// there was a problem setting up the service
func New(chainID string, databaseDSN string, lcdEndpoint string, blockPollIntervalSeconds int, log *logrus.Entry) (*Indexer, error) {

	db, err := gorm.Open(mysql.Open(databaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err

	}

	metaprotocols := make(map[string]metaprotocol.Processor)
	metaprotocols["inscription"] = metaprotocol.NewInscriptionProcessor()

	return &Indexer{
		chainID:                  chainID,
		lcdEndpoint:              lcdEndpoint,
		blockPollIntervalSeconds: blockPollIntervalSeconds,
		metaprotocols:            metaprotocols,
		logger:                   log,
		stopChannel:              make(chan bool),
		db:                       db,
	}, nil
}

func (i *Indexer) Run() error {
	i.logger.Info("Starting indexer")
	i.wg.Add(1)
	go i.indexBlocks()
	i.wg.Wait()

	return nil
}

func (i *Indexer) Stop() error {
	i.logger.Info("Stopping indexer")
	i.stopChannel <- true
	return nil
}

func (i *Indexer) indexBlocks() {
	var err error
	var currentHeight uint64
	// Fetch the latest processed height from the database
	var status models.Status
	result := i.db.First(&status, "chain_id = ?", i.chainID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// if the record doesn't exist, find the current height from the chain
			// and use that as the starting point for indexing
			currentHeight, err = i.fetchCurrentHeight()
			if err != nil {
				i.logger.Fatal(err)
			}
		} else {
			if err != nil {
				i.logger.Fatal(result.Error)
			}
		}
	} else {
		currentHeight = uint64(status.LastProcessedHeight)
	}

	i.logger.WithFields(logrus.Fields{
		"current_height": currentHeight,
	}).Info("Starting to fetch blocks")

	// Fetch blocks interval
	// ticker := time.NewTicker(time.Duration(i.blockPollIntervalSeconds) * time.Second)
	ticker := time.NewTicker(time.Duration(i.blockPollIntervalSeconds) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-i.stopChannel:
			i.logger.Info("Stop fetching data")
			i.wg.Done()
			return
		case <-ticker.C:

			// TODO: Check if the block even exists?!?!?!
			maxHeight, err := i.fetchCurrentHeight()
			if err != nil {
				// TODO: What do we do here if this fails?
				// Check specific types
				// If total failure, try again
				// If only partial, continue?
				i.logger.Fatal(err)
			}

			if currentHeight >= maxHeight {
				continue
			}

			i.logger.WithFields(logrus.Fields{
				"current_height": currentHeight,
				"max_height":     maxHeight,
				"lag":            maxHeight - currentHeight,
			}).Debug("Fetching block")

			// TODO: Remove height?
			_, transactions, err := i.fetchTransactions(currentHeight)
			if err != nil {
				// TODO: What do we do here if this fails?
				// Check specific types
				// If total failure, try again
				// If only partial, continue?
				i.logger.Fatal(err)
			}

			for _, tx := range transactions {
				// TODO Now query the hash from the LCD
				// We do this because we want more information, such as gas used
				// and a JSON-only way to parse the content

				txSize, rawTransaction, err := i.fetchTransaction(tx)
				if err != nil {
					i.logger.Fatal(err)
				}

				// Verify that this is a valid inscription.
				// That is, it must have a MsgSend and a MsgRevoke in
				// NonCriticalExtensionOptions
				if !rawTransaction.isValidInscription() {
					i.logger.WithFields(logrus.Fields{
						"hash": tx,
					}).Debug("Transaction is not an inscription")
					continue
				}

				// height, _ := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)
				// gasUsed, _ := strconv.ParseUint(rawTransaction.TxResponse.GasUsed, 10, 64)
				// fees, _ := json.Marshal(rawTransaction.Tx.AuthInfo.Fee.Amount)

				// txModel := models.Transaction{
				// 	Hash:          tx,
				// 	Height:        height,
				// 	Content:       rawTransaction.ToJSON(),
				// 	GasUsed:       gasUsed,
				// 	Fees:          string(fees),
				// 	ContentLength: uint64(txSize),
				// 	DateCreated:   rawTransaction.TxResponse.Timestamp,
				// }
				// result := i.db.Save(&txModel)
				// if result.Error != nil {
				// 	if result.Error == gorm.ErrDuplicatedKey || strings.Contains(result.Error.Error(), "Duplicate entry") {
				// 		i.logger.Warn("Transaction already exists:", tx)
				// 		continue
				// 	}
				// 	i.logger.Fatal(result.Error)
				// }
				_ = txSize

				// Process inscription
				err = i.processInscription(rawTransaction)
				if err != nil {
					i.logger.Fatal(err)
				}
			}

			// Apply rules for state
			// Store state

			// TODO: All good, increase height
			currentHeight = currentHeight + 1

			os.Exit(0)
		}
	}
}

func (i *Indexer) processInscription(rawTransaction RawTransaction) error {
	i.logger.Debug("Processing Inscription:", rawTransaction.TxResponse.Txhash)

	// TODO: Check for a duplicate of the content
	// rawTransaction.Tx.Body.NonCriticalExtensionOptions

	// Determine creator and owner of the inscription
	// We determine the creator as the sender of the first MsgSend message
	// in messages

	// Get the first transaction message
	firstMessage := rawTransaction.Tx.Body.Messages[0]
	sender := firstMessage.FromAddress
	_ = sender

	// TODO Decode the inscription
	for _, extension := range rawTransaction.Tx.Body.NonCriticalExtensionOptions {
		fmt.Println(extension.MsgTypeURL)

		u, ok := urn.Parse([]byte(extension.MsgTypeURL))
		if !ok {
			panic("error parsing urn")
		}

		fmt.Println(u.ID)
		fmt.Println(u.SS)
		fmt.Println(extension.Grantee)

		// Match the ID and send the SS to the correct processor with base64 data to decode
		processor, ok := i.metaprotocols[u.ID]
		if !ok {
			panic("No processor for this metaprotocol")
		}

		i.logger.WithFields(logrus.Fields{
			"processor": processor.Name(),
		}).Debug("Processing metaprotocol")

		metadata, _ := base64.StdEncoding.DecodeString(extension.Granter)
		data, err := base64.StdEncoding.DecodeString(extension.Grantee)
		if err != nil {
			fmt.Println("error decoding base64, skip", err)
		}

		dataModels, err := processor.Process(u.SS, metadata, data)
		if err != nil {
			fmt.Println("error processing metaprotocol, skip", err)
			return err
		}

		fmt.Println("Attmepting to save")

		for _, model := range dataModels {
			switch v := model.(type) {
			case models.Inscription:
				result := i.db.Save(&v)
				if result.Error != nil {
					fmt.Println(result.Error)
					return result.Error
				}
				fmt.Println("SAVED?")
			}
		}

		// switch model.(type) {
		// case models.Inscription:
		// 	fmt.Println("Inscription model")
		// }

		// switch extension.MsgTypeURL {
		// case InscriptionTypeContentGeneric:
		// 	fmt.Println("Generic inscription")
		// 	// Decode metadata for this type of inscription
		// 	metadataBytes, err := base64.StdEncoding.DecodeString(extension.Granter)
		// 	if err != nil {
		// 		return err
		// 	}

		// 	fmt.Println(string(metadataBytes))
		// 	var genericMetadata ContentGenericMetadata
		// 	err = json.Unmarshal(metadataBytes, &genericMetadata)
		// 	if err != nil {
		// 		return err
		// 	}

		// 	// Decode content to store on the disk
		// 	contentBytes, err := base64.StdEncoding.DecodeString(extension.Grantee)
		// 	if err != nil {
		// 		return err
		// 	}

		// 	parentJSON, err := json.Marshal(genericMetadata.Parent)
		// 	if err != nil {
		// 		return err
		// 	}

		// 	// For this type of inscription, the sender is the creator and owner
		// 	fmt.Println("creator", sender)
		// 	fmt.Println("owner", sender)
		// 	fmt.Println(genericMetadata.Parent.Type)
		// 	fmt.Println(genericMetadata.Parent.Identifier)
		// 	fmt.Println(genericMetadata.Metadata.Name)

		// 	ext, _ := mime.ExtensionsByType(genericMetadata.Metadata.MIME)
		// 	fmt.Println("MIME", genericMetadata.Metadata.MIME)
		// 	fmt.Println(fmt.Sprintf("Filename: inscription%s", ext))

		// 	endpoint := "ams3.digitaloceanspaces.com"
		// 	region := "ams3"
		// 	sess := session.Must(session.NewSession(&aws.Config{
		// 		Endpoint:    &endpoint,
		// 		Region:      &region,
		// 		Credentials: credentials.NewStaticCredentials("DO00HXJJQVNBTGA62TV7", "4YPA8WqAOgWRgotafeArld4oVjOhhnra21zmFw07PGU", ""),
		// 	}))

		// 	// Create an uploader with the session and default options
		// 	uploader := s3manager.NewUploader(sess)

		// 	myBucket := "inscriptions-mvp"
		// 	filename := rawTransaction.TxResponse.Txhash + ext[0]
		// 	// Upload the file to S3.
		// 	uploadResult, err := uploader.Upload(&s3manager.UploadInput{
		// 		ACL:    aws.String("public-read"),
		// 		Bucket: aws.String(myBucket),
		// 		Key:    aws.String(filename),
		// 		Body:   bytes.NewReader(contentBytes),
		// 	})
		// 	if err != nil {
		// 		return fmt.Errorf("failed to upload file, %v", err)
		// 	}
		// 	fmt.Printf("file uploaded to, %s\n", aws.StringValue(&uploadResult.Location))

		// 	height, _ := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)

		// 	inscriptionModel := models.Inscription{
		// 		Height:         height,
		// 		Hash:           rawTransaction.TxResponse.Txhash,
		// 		Creator:        sender,
		// 		Owner:          sender,
		// 		Parent:         string(parentJSON),
		// 		Type:           extension.MsgTypeURL,
		// 		MetadataBase64: extension.Granter,
		// 		ContentBase64:  extension.Grantee,
		// 		ContentPath:    aws.StringValue(&uploadResult.Location),
		// 		DateCreated:    rawTransaction.TxResponse.Timestamp,
		// 	}

		// 	result := i.db.Save(&inscriptionModel)
		// 	if result.Error != nil {
		// 		return result.Error
		// 	}

		// case InscriptionTypeContentNFT:
		// 	fmt.Println("NFT inscription")
		// }

	}

	// TODO Handle the different type of inscriptions

	return nil
}

// fetchCurrentHeight fetches the current height from the chain by using the
// RPC /status endpoint
func (i *Indexer) fetchCurrentHeight() (uint64, error) {
	resp, err := http.Get(fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/latest", i.lcdEndpoint))
	if err != nil {
		return 0, err
	}
	var block LCDBlock
	err = json.NewDecoder(resp.Body).Decode(&block)
	if err != nil {
		return 0, err
	}
	return strconv.ParseUint(block.Block.Header.Height, 10, 64)
}

// fetchTransactions fetches all the transaction hashes in a block
func (i *Indexer) fetchTransactions(height uint64) (uint64, []string, error) {
	var transactions []string

	resp, err := http.Get(fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/%d", i.lcdEndpoint, height))
	if err != nil {
		return height, transactions, err
	}
	var lcdBlock LCDBlock
	err = json.NewDecoder(resp.Body).Decode(&lcdBlock)
	if err != nil {
		return height, transactions, err
	}
	i.logger.WithFields(logrus.Fields{
		"height": height,
		"txs":    len(lcdBlock.Block.Data.Txs),
	}).Debug("Fetched block")

	for _, tx := range lcdBlock.Block.Data.Txs {
		// decoder := cosmosutils.DefaultDecoder
		// decodedTx, err := decoder.DecodeBase64(tx)
		// if err != nil {
		// 	// If we can't decode the base64, there is something wrong with the
		// 	// transaction and we ignore it
		// 	i.logger.Warn("Error decoding transaction base64:", err)
		// 	continue
		// }

		// Get the transaction hash by converting the base64 to hex
		// This is the same as the transaction hash in the block explorer
		txBytes, err := base64.StdEncoding.DecodeString(tx)
		if err != nil {
			// If we can't marshal to JSON, we probably have invalid characters
			i.logger.Warn("Error encode transaction JSON:", err)
			continue
		}

		// Create transaction hash
		s := sha256.New()
		s.Write(txBytes)
		s.Sum(nil)
		txHash := strings.ToUpper(hex.EncodeToString(s.Sum(nil)))
		transactions = append(transactions, txHash)

		// // Convert to a JSON format to make it easier to decode
		// jsonBytes, err := decodedTx.MarshalToJSON()
		// if err != nil {
		// 	// If we can't marshal to JSON, we probably have invalid characters
		// 	i.logger.Warn("Error encode transaction JSON:", err)
		// 	continue
		// }

		// var cosmosTx cosmosutils.CosmosTx
		// jsonDecoder := json.NewDecoder(bytes.NewReader(jsonBytes))
		// jsonDecoder.DisallowUnknownFields()
		// err = jsonDecoder.Decode(&cosmosTx)
		// if err != nil {
		// 	// This indicates that the transaction doesn't follow the standard
		// 	// Cosmos transaction format. We can safely ignore this transaction
		// 	i.logger.Warn("Error decoding transaction:", err)
		// }

		// fmt.Println(cosmosTx.Body.NonCriticalExtensionOptions...)

		// transactions = append(transactions, Tx{
		// 	Hash:     txHash,
		// 	RawTx:    tx,
		// 	ParsedTx: string(jsonBytes),
		// 	CosmosTx: cosmosTx,
		// })

		// for _, inscription := range cosmosTx.Body.NonCriticalExtensionOptions {
		// 	inscriptionBytes, err := json.Marshal(inscription)
		// 	if err != nil {
		// 		// This indicates that the extension option contains something
		// 		// invalid and we will ignore the inscription
		// 		i.logger.Warn("Error marshalling inscription to bytes:", err)
		// 		continue
		// 	}
		// 	var rawInscription RawInscription
		// 	err = json.Unmarshal(inscriptionBytes, &rawInscription)
		// 	if err != nil {
		// 		// This indicates that the extension option doesn't follow the
		// 		// predefined format. We will ignore this inscription
		// 		i.logger.Warn("Error decoding into RawInscription:", err)
		// 		continue
		// 	}
		// 	// Verify that this is a revoke message, if not, it doesn't follow
		// 	// the spec
		// 	if rawInscription.Type != "/cosmos.authz.v1beta1.MsgRevoke" {
		// 		i.logger.Warn("Invalid inscription type:", rawInscription.Type)
		// 		continue
		// 	}

		// 	rawInscriptions = append(rawInscriptions, rawInscription)
		// }

	}
	return height, transactions, nil
}

// fetchTransaction fetches a single transaction from the LCD
func (i *Indexer) fetchTransaction(hash string) (int, RawTransaction, error) {
	resp, err := http.Get(fmt.Sprintf("%s/cosmos/tx/v1beta1/txs/%s", i.lcdEndpoint, hash))
	if err != nil {
		return 0, RawTransaction{}, err
	}
	var rawTransaction RawTransaction
	err = json.NewDecoder(resp.Body).Decode(&rawTransaction)
	if err != nil {
		return 0, RawTransaction{}, err
	}
	i.logger.WithFields(logrus.Fields{
		"hash": hash,
	}).Debug("Fetched transaction")

	// for _, tx := range lcdBlock.Block.Data.Txs {
	// // decoder := cosmosutils.DefaultDecoder
	// // decodedTx, err := decoder.DecodeBase64(tx)
	// // if err != nil {
	// // 	// If we can't decode the base64, there is something wrong with the
	// // 	// transaction and we ignore it
	// // 	i.logger.Warn("Error decoding transaction base64:", err)
	// // 	continue
	// // }

	// // Get the transaction hash by converting the base64 to hex
	// // This is the same as the transaction hash in the block explorer
	// txBytes, err := base64.StdEncoding.DecodeString(tx)
	// if err != nil {
	// 	// If we can't marshal to JSON, we probably have invalid characters
	// 	i.logger.Warn("Error encode transaction JSON:", err)
	// 	continue
	// }

	// // Create transaction hash
	// s := sha256.New()
	// s.Write(txBytes)
	// s.Sum(nil)
	// txHash := strings.ToUpper(hex.EncodeToString(s.Sum(nil)))
	// fmt.Println("Tx hash:", string(txHash))

	// transactions = append(transactions, txHash)

	// // Convert to a JSON format to make it easier to decode
	// jsonBytes, err := decodedTx.MarshalToJSON()
	// if err != nil {
	// 	// If we can't marshal to JSON, we probably have invalid characters
	// 	i.logger.Warn("Error encode transaction JSON:", err)
	// 	continue
	// }

	// var cosmosTx cosmosutils.CosmosTx
	// jsonDecoder := json.NewDecoder(bytes.NewReader(jsonBytes))
	// jsonDecoder.DisallowUnknownFields()
	// err = jsonDecoder.Decode(&cosmosTx)
	// if err != nil {
	// 	// This indicates that the transaction doesn't follow the standard
	// 	// Cosmos transaction format. We can safely ignore this transaction
	// 	i.logger.Warn("Error decoding transaction:", err)
	// }

	// fmt.Println(cosmosTx.Body.NonCriticalExtensionOptions...)

	// transactions = append(transactions, Tx{
	// 	Hash:     txHash,
	// 	RawTx:    tx,
	// 	ParsedTx: string(jsonBytes),
	// 	CosmosTx: cosmosTx,
	// })

	// for _, inscription := range cosmosTx.Body.NonCriticalExtensionOptions {
	// 	inscriptionBytes, err := json.Marshal(inscription)
	// 	if err != nil {
	// 		// This indicates that the extension option contains something
	// 		// invalid and we will ignore the inscription
	// 		i.logger.Warn("Error marshalling inscription to bytes:", err)
	// 		continue
	// 	}
	// 	var rawInscription RawInscription
	// 	err = json.Unmarshal(inscriptionBytes, &rawInscription)
	// 	if err != nil {
	// 		// This indicates that the extension option doesn't follow the
	// 		// predefined format. We will ignore this inscription
	// 		i.logger.Warn("Error decoding into RawInscription:", err)
	// 		continue
	// 	}
	// 	// Verify that this is a revoke message, if not, it doesn't follow
	// 	// the spec
	// 	if rawInscription.Type != "/cosmos.authz.v1beta1.MsgRevoke" {
	// 		i.logger.Warn("Invalid inscription type:", rawInscription.Type)
	// 		continue
	// 	}

	// 	rawInscriptions = append(rawInscriptions, rawInscription)
	// }

	// }
	return rawTransaction.GetTxByteSize(), rawTransaction, nil
}
