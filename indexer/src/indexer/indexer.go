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

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
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

	return &Indexer{
		chainID:                  chainID,
		lcdEndpoint:              lcdEndpoint,
		blockPollIntervalSeconds: blockPollIntervalSeconds,
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
	ticker := time.NewTicker(time.Duration(i.blockPollIntervalSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-i.stopChannel:
			i.logger.Info("Stop fetching data")
			i.wg.Done()
			return
		case <-ticker.C:
			i.logger.WithFields(logrus.Fields{
				"current_height": currentHeight,
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
				// 	DateCreated:   time.Now(),
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
			// currentHeight = height + 1

			os.Exit(0)
		}
	}
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
