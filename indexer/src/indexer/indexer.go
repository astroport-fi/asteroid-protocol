package indexer

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/metaprotocol"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	ChainID                  string   `envconfig:"CHAIN_ID" required:"true"`
	BaseTokenBinanceEndpoint string   `envconfig:"BASE_TOKEN_BINANCE_ENDPOINT" required:"true"`
	DatabaseDSN              string   `envconfig:"DATABASE_DSN" required:"true"`
	LCDEndpoints             []string `envconfig:"LCD_ENDPOINTS" required:"true"`
	BlockPollIntervalMS      int      `envconfig:"BLOCK_POLL_INTERVAL_MS" required:"true"`
}

// Indexer implements the reference indexer service
type Indexer struct {
	chainID                  string
	baseTokenBinanceEndpoint string
	lcdEndpoints             []string
	blockPollIntervalMS      int
	logger                   *logrus.Entry
	metaprotocols            map[string]metaprotocol.Processor
	stopChannel              chan bool
	db                       *gorm.DB
	wg                       sync.WaitGroup
}

// New returns a new instance of the indexer service and returns an error if
// there was a problem setting up the service
func New(
	log *logrus.Entry) (*Indexer, error) {

	// Parse config environment variables for self
	var config Config
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	db, err := gorm.Open(postgres.Open(config.DatabaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err

	}

	metaprotocols := make(map[string]metaprotocol.Processor)
	metaprotocols["inscription"] = metaprotocol.NewInscriptionProcessor(config.ChainID, db)
	metaprotocols["cft20"] = metaprotocol.NewCFT20Processor(config.ChainID, db)

	return &Indexer{
		chainID:                  config.ChainID,
		baseTokenBinanceEndpoint: config.BaseTokenBinanceEndpoint,
		lcdEndpoints:             config.LCDEndpoints,
		blockPollIntervalMS:      config.BlockPollIntervalMS,
		metaprotocols:            metaprotocols,
		logger:                   log,
		stopChannel:              make(chan bool),
		db:                       db,
	}, nil
}

// Run the indexer service forever
func (i *Indexer) Run() error {
	i.logger.Info("Starting indexer")
	i.wg.Add(1)
	go i.indexBlocks()

	i.wg.Add(1)
	go i.updateBaseToken()

	i.wg.Wait()

	return nil
}

// Stop the indexer
func (i *Indexer) Stop() error {
	i.logger.Info("Stopping indexer")
	i.stopChannel <- true
	i.stopChannel <- true
	return nil
}

// indexBlocks fetches blocks from the chain, indexes them and stores a
// record of the last processed block
func (i *Indexer) indexBlocks() {
	var err error
	var currentHeight uint64
	// Fetch the latest processed height from the database
	var status models.Status
	result := i.db.Where("chain_id = ?", i.chainID).First(&status)
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
	ticker := time.NewTicker(time.Duration(i.blockPollIntervalMS) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-i.stopChannel:
			i.logger.Info("Stop fetching data")
			i.wg.Done()
			return
		case <-ticker.C:

			maxHeight, err := i.fetchCurrentHeight()
			if err != nil {
				i.logger.Fatal(err)
			}

			if currentHeight >= maxHeight {
				continue
			}

			i.logger.WithFields(logrus.Fields{
				"current_height": currentHeight,
				"max_height":     maxHeight,
				"lag":            maxHeight - currentHeight,
			}).Info("Fetching block")

			_, transactions, err := i.fetchTransactions(currentHeight)
			if err != nil {
				i.logger.Fatal(err)
			}

			for _, tx := range transactions {
				// Get the full transaction from the LCD
				// We do this because we want more information, such as gas used
				// and a JSON-only way to parse the content
				txSize, rawTransaction, err := i.fetchTransaction(tx)
				if err != nil {
					i.logger.Error(err)
					continue
				}

				// Verify that this transaction is a metaprotocol inscription
				if err := rawTransaction.ValidateBasic(); err != nil {
					i.logger.WithFields(logrus.Fields{
						"hash": tx,
					}).Debug(err)

					// TODO: Surface the error to the UI

					continue
				}

				// Extract some commonly used values
				height, err := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)
				if err != nil {
					i.logger.Fatal(err)
				}
				gasUsed, err := strconv.ParseUint(rawTransaction.TxResponse.GasUsed, 10, 64)
				if err != nil {
					i.logger.Fatal(err)
				}

				fees, err := json.Marshal(rawTransaction.Tx.AuthInfo.Fee.Amount)
				if err != nil {
					i.logger.Fatal(err)
				}

				// Store the transaction
				txModel := models.Transaction{
					Hash:          tx,
					Height:        height,
					Content:       rawTransaction.ToJSON(),
					GasUsed:       gasUsed,
					Fees:          string(fees),
					ContentLength: uint64(txSize),
					DateCreated:   rawTransaction.TxResponse.Timestamp,
					StatusMessage: types.TransactionStatePending,
				}
				result := i.db.Save(&txModel)
				if result.Error != nil {
					// If the error is a duplicate key error, we ignore it
					if result.Error != gorm.ErrDuplicatedKey && !strings.Contains(result.Error.Error(), "duplicate key value") {
						i.logger.WithFields(logrus.Fields{
							"hash": rawTransaction.TxResponse.Txhash,
							"err":  result.Error,
						}).Fatal("Unable to store transaction")
					}
				}

				// Process metaprotocol memo
				statusMessage := types.TransactionStateSuccess
				err = i.processMetaprotocolMemo(txModel, rawTransaction)
				if err != nil {
					i.logger.WithFields(logrus.Fields{
						"hash": rawTransaction.TxResponse.Txhash,
					}).Error(err)
					statusMessage = fmt.Sprintf("%s: %s", types.TransactionStateError, err)
				}

				// If there is an error in processing the metaprotocol,
				// store the error in the transaction for frontend feedback
				txModel.StatusMessage = statusMessage
				result = i.db.Save(&txModel)
				if result.Error != nil {
					i.logger.WithFields(logrus.Fields{
						"hash": rawTransaction.TxResponse.Txhash,
						"err":  result.Error,
					}).Warning("Unable to update transaction status")
				}

				i.logger.WithFields(logrus.Fields{
					"hash": rawTransaction.TxResponse.Txhash,
				}).Info("Transaction processed")
			}

			// All good, save last processed and increase height
			status.LastProcessedHeight = currentHeight
			i.db.Model(&status).Where("chain_id = ?", i.chainID).UpdateColumns(map[string]interface{}{
				"last_processed_height": currentHeight,
				"date_updated":          time.Now(),
			})
			currentHeight = currentHeight + 1
		}
	}
}

// updateBaseToken updates the price of the base token every minute
// via CoinGecko
func (i *Indexer) updateBaseToken() {
	// Fetch blocks interval
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-i.stopChannel:
			i.logger.Info("Stop fetching price data")
			i.wg.Done()
			return
		case <-ticker.C:
			queryResult, err := http.Get(i.baseTokenBinanceEndpoint)
			if err != nil {
				i.logger.Error(err)
			}
			defer queryResult.Body.Close()

			var response map[string]string
			err = json.NewDecoder(queryResult.Body).Decode(&response)
			if err != nil {
				i.logger.Error(err)
			}

			// Store the price
			price, err := strconv.ParseFloat(response["price"], 64)
			if err != nil {
				i.logger.Error(err)
			}

			var statusModel models.Status
			result := i.db.Where("chain_id = ?", i.chainID).First(&statusModel)
			if result.Error != nil {
				i.logger.Error(result.Error)
			}

			result = i.db.Model(&statusModel).Where("chain_id = ?", i.chainID).Update("base_token_usd", price)
			if result.Error != nil {
				i.logger.Error(result.Error)
			} else {
				i.logger.WithFields(logrus.Fields{
					"price": price,
				}).Info("Updated base token price")
			}
		}
	}
}

// processMetaprotocolMemo handles the processing of different metaprotocols
func (i *Indexer) processMetaprotocolMemo(transactionModel models.Transaction, rawTransaction types.RawTransaction) error {
	i.logger.WithFields(logrus.Fields{
		"hash": rawTransaction.TxResponse.Txhash,
	}).Debug("Processing memo")

	metaprotocolURN, ok := urn.Parse([]byte(rawTransaction.Tx.Body.Memo))
	if !ok {
		return errors.New("invalid metaprotocol URN")
	}

	// Match the ID and send the SS to the correct processor with base64 data to decode
	processor, ok := i.metaprotocols[metaprotocolURN.ID]
	if !ok {
		return fmt.Errorf("no processor for metaprotocol '%s'", metaprotocolURN.ID)
	}

	i.logger.WithFields(logrus.Fields{
		"processor": processor.Name(),
		"hash":      rawTransaction.TxResponse.Txhash,
	}).Info("Processing metaprotocol")

	err := processor.Process(transactionModel, metaprotocolURN, rawTransaction)
	if err != nil {
		i.logger.WithFields(logrus.Fields{
			"metaprotocol": metaprotocolURN.ID,
			"err":          err,
			"hash":         rawTransaction.TxResponse.Txhash,
		}).Error("failed to process, skipping")
		return err
	}

	return nil
}

// fetchCurrentHeight fetches the current height from the chain by using the
// RPC /status endpoint
func (i *Indexer) fetchCurrentHeight() (uint64, error) {
	endpoint := i.randomEndpoint()
	resp, err := http.Get(fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/latest", endpoint))
	if err != nil {
		return 0, err
	}
	var block types.LCDBlock
	err = json.NewDecoder(resp.Body).Decode(&block)
	if err != nil {
		return 0, err
	}
	i.logger.WithFields(logrus.Fields{
		"height":   block.Block.Header.Height,
		"endpoint": endpoint,
	}).Debug("Fetched current height")
	return strconv.ParseUint(block.Block.Header.Height, 10, 64)
}

// fetchTransactions fetches all the transaction hashes in a block
func (i *Indexer) fetchTransactions(height uint64) (uint64, []string, error) {
	var transactions []string

	endpoint := i.randomEndpoint()
	resp, err := http.Get(fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/%d", endpoint, height))
	if err != nil {
		return height, transactions, err
	}
	var lcdBlock types.LCDBlock
	err = json.NewDecoder(resp.Body).Decode(&lcdBlock)
	if err != nil {
		return height, transactions, err
	}
	i.logger.WithFields(logrus.Fields{
		"height":   height,
		"txs":      len(lcdBlock.Block.Data.Txs),
		"endpoint": endpoint,
	}).Debug("Fetched block")

	for _, tx := range lcdBlock.Block.Data.Txs {

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

	}
	return height, transactions, nil
}

// fetchTransaction fetches a single transaction from the LCD
func (i *Indexer) fetchTransaction(hash string) (int, types.RawTransaction, error) {
	endpoint := i.randomEndpoint()
	resp, err := http.Get(fmt.Sprintf("%s/cosmos/tx/v1beta1/txs/%s", endpoint, hash))
	if err != nil {
		return 0, types.RawTransaction{}, err
	}
	var rawTransaction types.RawTransaction
	err = json.NewDecoder(resp.Body).Decode(&rawTransaction)
	if err != nil {
		return 0, types.RawTransaction{}, err
	}
	i.logger.WithFields(logrus.Fields{
		"hash":     hash,
		"endpoint": endpoint,
	}).Debug("Fetched transaction")

	return rawTransaction.GetTxByteSize(), rawTransaction, nil
}

// randomEndpoint returns a random LCD endpoint to use
// We do this to balance the load across multiple endpoints very naively
func (i *Indexer) randomEndpoint() string {
	return i.lcdEndpoints[rand.Intn(len(i.lcdEndpoints))]
}
