package indexer

import (
	"context"
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

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/decoder"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/metaprotocol"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	ChainID                  string            `envconfig:"CHAIN_ID" required:"true"`
	BaseTokenBinanceEndpoint string            `envconfig:"BASE_TOKEN_BINANCE_ENDPOINT" required:"true"`
	DatabaseDSN              string            `envconfig:"DATABASE_DSN" required:"true"`
	DatabaseURL              string            `envconfig:"DATABASE_URL" required:"true"`
	LCDEndpoints             []string          `envconfig:"LCD_ENDPOINTS" required:"true"`
	RPCEndpoints             []string          `envconfig:"RPC_ENDPOINTS" required:"true"`
	EndpointHeaders          map[string]string `envconfig:"ENDPOINT_HEADERS" required:"true"`
	BlockPollIntervalMS      int               `envconfig:"BLOCK_POLL_INTERVAL_MS" required:"true"`
}

// Indexer implements the reference indexer service
type Indexer struct {
	chainID                  string
	baseTokenBinanceEndpoint string
	lcdEndpoints             []string
	rpcEndpoints             []string
	endpointHeaders          map[string]string
	blockPollIntervalMS      int
	logger                   *logrus.Entry
	metaprotocols            map[string]metaprotocol.Processor
	stopChannel              chan bool
	db                       *gorm.DB
	workerClient             *river.Client[pgx.Tx]
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

	// Setup database connection
	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, config.DatabaseURL)
	if err != nil {
		return nil, err
	}

	workerClient, err := river.NewClient(riverpgxv5.New(dbPool), &river.Config{})
	if err != nil {
		panic(err)
	}

	metaprotocols := make(map[string]metaprotocol.Processor)
	metaprotocols["inscription"] = metaprotocol.NewInscriptionProcessor(config.ChainID, db, workerClient)
	metaprotocols["cft20"] = metaprotocol.NewCFT20Processor(config.ChainID, db)
	metaprotocols["marketplace"] = metaprotocol.NewMarketplaceProcessor(config.ChainID, db)

	return &Indexer{
		chainID:                  config.ChainID,
		baseTokenBinanceEndpoint: config.BaseTokenBinanceEndpoint,
		lcdEndpoints:             config.LCDEndpoints,
		rpcEndpoints:             config.RPCEndpoints,
		endpointHeaders:          config.EndpointHeaders,
		blockPollIntervalMS:      config.BlockPollIntervalMS,
		metaprotocols:            metaprotocols,
		logger:                   log,
		stopChannel:              make(chan bool),
		db:                       db,
		workerClient:             workerClient,
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

			// Instead of fetching each transaction individually
			// fetch the block and decode the protobuf contents
			// All metaprotocols require a MsgSend transaction
			block, transactions, err := i.fetchTransactions(currentHeight)
			if err != nil {
				i.logger.Fatal(err)
			}

			// Extract some commonly used values
			height, err := strconv.ParseUint(block.Block.Header.Height, 10, 64)
			if err != nil {
				i.logger.Fatal(err)
			}

			for _, tx := range transactions {
				gasUsed, err := strconv.ParseUint(tx.AuthInfo.Fee.GasLimit, 10, 64)
				if err != nil {
					i.logger.Fatal(err)
				}

				fees, err := json.Marshal(tx.AuthInfo.Fee.Amount)
				if err != nil {
					i.logger.Fatal(err)
				}

				contentLength := len(tx.ToJSON())

				// Store the transaction
				txModel := models.Transaction{
					Hash:          tx.Hash,
					Height:        height,
					Content:       tx.ToJSON(),
					GasUsed:       gasUsed,
					Fees:          string(fees),
					ContentLength: uint64(contentLength),
					DateCreated:   block.Block.Header.Time,
					StatusMessage: types.TransactionStatePending,
				}
				result := i.db.Save(&txModel)
				if result.Error != nil {
					// If the error is a duplicate key error, we ignore it
					if result.Error != gorm.ErrDuplicatedKey && !strings.Contains(result.Error.Error(), "duplicate key value") {
						i.logger.WithFields(logrus.Fields{
							"hash": tx.Hash,
							"err":  result.Error,
						}).Fatal("Unable to store transaction")
					}
				}

				// Process metaprotocol memo
				statusMessage := types.TransactionStateSuccess
				err = i.processMetaprotocolMemo(txModel, tx)
				if err != nil {
					i.logger.WithFields(logrus.Fields{
						"hash": tx.Hash,
					}).Error(err)
					statusMessage = fmt.Sprintf("%s: %s", types.TransactionStateError, err)
				}

				// If there is an error in processing the metaprotocol,
				// store the error in the transaction for frontend feedback
				txModel.StatusMessage = statusMessage
				result = i.db.Save(&txModel)
				if result.Error != nil {
					i.logger.WithFields(logrus.Fields{
						"hash": tx.Hash,
						"err":  result.Error,
					}).Warning("Unable to update transaction status")
				}

				i.logger.WithFields(logrus.Fields{
					"hash": tx.Hash,
				}).Info("Transaction processed")
			}

			i.logger.WithFields(logrus.Fields{
				"height": height,
			}).Info("Block processed")

			// All good, save last processed and increase height
			status.LastProcessedHeight = currentHeight
			i.db.Model(&status).Where("chain_id = ?", i.chainID).UpdateColumns(map[string]interface{}{
				"last_known_height":     maxHeight,
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
		"hash": rawTransaction.Hash,
	}).Debug("Processing memo")

	metaprotocolURN, ok := urn.Parse([]byte(rawTransaction.Body.Memo))
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
		"hash":      rawTransaction.Hash,
	}).Info("Processing metaprotocol")

	err := processor.Process(transactionModel, metaprotocolURN, rawTransaction)
	if err != nil {
		i.logger.WithFields(logrus.Fields{
			"metaprotocol": metaprotocolURN.ID,
			"err":          err,
			"hash":         rawTransaction.Hash,
		}).Error("failed to process, skipping")
		return err
	}

	return nil
}

// fetchCurrentHeight fetches the current height from the chain by using the
// RPC /status endpoint
func (i *Indexer) fetchCurrentHeight() (uint64, error) {
	endpoint := i.randomLCDEndpoint()

	// Add support for custom endpoint headers
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/latest", endpoint), nil)
	if err != nil {
		return 0, err
	}
	for key, value := range i.endpointHeaders {
		req.Header.Add(key, value)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

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
func (i *Indexer) fetchTransactions(height uint64) (types.LCDBlock, []types.RawTransaction, error) {
	var transactions []types.RawTransaction
	var lcdBlock types.LCDBlock

	endpoint := i.randomLCDEndpoint()
	// Add support for custom endpoint headers
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/cosmos/base/tendermint/v1beta1/blocks/%d", endpoint, height), nil)
	if err != nil {
		return lcdBlock, transactions, err
	}
	for key, value := range i.endpointHeaders {
		req.Header.Add(key, value)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return lcdBlock, transactions, err
	}

	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&lcdBlock)
	if err != nil {
		return lcdBlock, transactions, err
	}
	i.logger.WithFields(logrus.Fields{
		"height":   height,
		"txs":      len(lcdBlock.Block.Data.Txs),
		"endpoint": endpoint,
	}).Debug("Fetched block")

	// TODO: Fetch block results for this height as well to determine if the
	// transaction was successful or not based on ID
	rpcEndpoint := i.randomRPCEndpoint()

	// Add support for custom endpoint headers
	req, err = http.NewRequest("GET", fmt.Sprintf("%s/block_results?height=%d", rpcEndpoint, height), nil)
	if err != nil {
		return lcdBlock, transactions, err
	}
	for key, value := range i.endpointHeaders {
		req.Header.Add(key, value)
	}
	client = &http.Client{}
	rpcResp, err := client.Do(req)
	if err != nil {
		return lcdBlock, transactions, err
	}

	defer rpcResp.Body.Close()

	var rpcBlock types.RPCBlockResult
	err = json.NewDecoder(rpcResp.Body).Decode(&rpcBlock)
	if err != nil {
		return lcdBlock, transactions, err
	}
	i.logger.WithFields(logrus.Fields{
		"height":   height,
		"txs":      len(rpcBlock.Result.TxsResults),
		"endpoint": endpoint,
	}).Debug("Fetched block results")

	// The result of the transaction is stored in the block results in order
	transactionResultIndex := make(map[int]types.TxResult)
	for index, txResult := range rpcBlock.Result.TxsResults {
		transactionResultIndex[index] = txResult
	}

	for index, tx := range lcdBlock.Block.Data.Txs {

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

		// Check if the transaction was a success, if not, skip
		if transactionResultIndex[index].Code != 0 {
			i.logger.WithFields(logrus.Fields{
				"hash": txHash,
				"log":  transactionResultIndex[index].Log,
			}).Warn("Transaction failed, skipping")
			continue
		}

		// Decode the protobuf encoded transaction
		decoder := decoder.DefaultDecoder
		decodedTx, err := decoder.DecodeBase64(tx)
		if err != nil {
			// Unable to decode the protobuf, we'll need to skip
			i.logger.WithFields(logrus.Fields{
				"height": height,
				"txs":    txHash,
				"err":    err,
			}).Warn("unable to decode protobuf transaction")
			continue
		}

		// The rest of the indexer is looking for JSON. For now we'll continue
		// with that and refactor at a later stage
		// TODO: Refactor how transactions are handled internally
		jsonTx, err := decodedTx.MarshalToJSON()
		if err != nil {
			// If we can't marshal to JSON, we can't use it
			i.logger.WithFields(logrus.Fields{
				"height": height,
				"txs":    txHash,
				"err":    err,
			}).Warn("unable to JSON encode transaction")
			continue
		}

		// To RawTransaction as is expected
		var rawTransaction types.RawTransaction
		err = json.Unmarshal(jsonTx, &rawTransaction)
		if err != nil {
			// If we can't git it in the RawTransaction format, we can't use it
			i.logger.WithFields(logrus.Fields{
				"height": height,
				"txs":    txHash,
				"err":    err,
			}).Warn("unable to JSON encode transaction")
			continue
		}

		// Add the hash as it isn't there by default
		rawTransaction.Hash = txHash
		transactions = append(transactions, rawTransaction)

		// TODO: Add hash somehow?

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
		// transactions = append(transactions, txHash)

	}
	return lcdBlock, transactions, nil
}

// randomEndpoint returns a random LCD endpoint to use
// We do this to balance the load across multiple endpoints very naively
func (i *Indexer) randomLCDEndpoint() string {
	return i.lcdEndpoints[rand.Intn(len(i.lcdEndpoints))]
}

// randomEndpoint returns a random RPC endpoint to use
// We do this to balance the load across multiple endpoints very naively
func (i *Indexer) randomRPCEndpoint() string {
	return i.rpcEndpoints[rand.Intn(len(i.rpcEndpoints))]
}
