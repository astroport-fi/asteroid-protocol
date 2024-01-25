package metaprotocol

import (
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type MarketplaceConfig struct {
	MinimumTimeoutBlocks uint64  `envconfig:"MARKET_MIN_TIMEOUT" required:"true"`
	MinimumDeposit       float64 `envconfig:"MARKET_MIN_DEPOSIT" required:"true"`
	MinimumTradeSize     float64 `envconfig:"MARKET_MIN_TRADE" required:"true"`
	TradeFee             float64 `envconfig:"MARKET_TRADE_FEE" required:"true"`

	LCDEndpoints    []string          `envconfig:"LCD_ENDPOINTS" required:"true"`
	EndpointHeaders map[string]string `envconfig:"ENDPOINT_HEADERS" required:"true"`
}

type Marketplace struct {
	chainID              string
	version              string
	virtualAddress       string
	minimumTimeoutBlocks uint64
	minimumDeposit       float64
	minimumTradeSize     float64
	tradeFee             float64
	db                   *gorm.DB

	lcdEndpoints    []string
	endpointHeaders map[string]string
}

func NewMarketplaceProcessor(chainID string, db *gorm.DB) *Marketplace {
	// Parse config environment variables for self
	var config MarketplaceConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &Marketplace{
		chainID:              chainID,
		version:              "v1",
		virtualAddress:       "marketplace-v2",
		minimumTimeoutBlocks: config.MinimumTimeoutBlocks,
		minimumDeposit:       config.MinimumDeposit,
		minimumTradeSize:     config.MinimumTradeSize,
		tradeFee:             config.TradeFee,
		db:                   db,
		lcdEndpoints:         config.LCDEndpoints,
		endpointHeaders:      config.EndpointHeaders,
	}
}

func (protocol *Marketplace) Name() string {
	return "marketplace"
}

func (protocol *Marketplace) Process(currentTransaction models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return err
	}

	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;deploy$nam=The Name,tic=TICK,sup=21000000,dec=6,lim=1000
	// cosmoshub-4@v1beta;deploy$nam=NewYearDay,tic=NYD,sup=28000000,dec=18,lim=50000,opn=1704059940
	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return err
	}

	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("chain ID in protocol string does not match transaction chain ID")
	}

	if parsedURN.Version != protocol.version {
		return fmt.Errorf("version in protocol string does not match transaction version")
	}

	currentHeight := currentTransaction.Height

	// TODO: Rework the operation handling
	switch parsedURN.Operation {
	case "list.cft20":

		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		// We will actually be sending the tokens to the marketplace address
		destinationAddress := protocol.virtualAddress

		// Check required fields
		amountString := strings.TrimSpace(parsedURN.KeyValuePairs["amt"])
		// Convert amount to have the correct number of decimals
		amount, err := strconv.ParseFloat(amountString, 64)
		if err != nil {
			return fmt.Errorf("unable to parse amount '%s'", err)
		}
		if amount <= 0 {
			return fmt.Errorf("amount must be greater than 0")
		}

		pptString := strings.TrimSpace(parsedURN.KeyValuePairs["ppt"])
		// Convert amount to have the correct number of decimals
		ppt, err := strconv.ParseFloat(pptString, 64)
		if err != nil {
			return fmt.Errorf("unable to parse ppt '%s'", err)
		}
		if ppt <= 0 {
			return fmt.Errorf("price per token must be greater than 0")
		}
		totalBase := float64(amount) * ppt
		if totalBase < protocol.minimumTradeSize {
			return fmt.Errorf("total trade size must be greater than %.6f", protocol.minimumTradeSize)
		}

		// 6 is the amount of ATOM decimals
		ppt = ppt * math.Pow10(6)
		amount = amount * math.Pow10(int(tokenModel.Decimals))
		totalBase = totalBase * math.Pow10(6)

		// Get the minimum deposit
		minDepositString := strings.TrimSpace(parsedURN.KeyValuePairs["mindep"])
		// Convert amount to have the correct number of decimals
		minDeposit, err := strconv.ParseFloat(minDepositString, 64)
		if err != nil {
			return fmt.Errorf("unable to parse ppt '%s'", err)
		}
		if minDeposit <= 0 {
			return fmt.Errorf("minimum deposit must be greater than 0")
		}
		if minDeposit < protocol.minimumDeposit {
			return fmt.Errorf("minimum deposit percentage too small")
		}

		// Calculate the ATOM amount of the minimum deposit by checking against
		// totalBase
		minDepositBase := minDeposit * totalBase
		if minDepositBase < 1 {
			minDepositBase = 1
		}

		// Get the listing timeout
		timeoutString := strings.TrimSpace(parsedURN.KeyValuePairs["to"])
		timeout, err := strconv.ParseUint(timeoutString, 10, 64)
		if err != nil {
			return fmt.Errorf("unable to parse to '%s'", err)
		}
		if timeout < protocol.minimumTimeoutBlocks {
			return fmt.Errorf("timeout must be greater than the minimum of %d", protocol.minimumTimeoutBlocks)
		}

		// Verify that the sender has sent enough tokens to cover the listing fee
		amountSent, err := GetBaseTokensSentIBC(rawTransaction)
		if err != nil {
			return fmt.Errorf("invalid tokens sent '%s'", err)
		}
		if amountSent < uint64(math.Floor(minDepositBase)) {
			return fmt.Errorf("sender did not send enough tokens to cover the listing fee")
		}

		// Verify that the sender has sent enough tokens to cover the listing fee
		// amountSent, err := GetBaseTokensSent(rawTransaction)
		// if err != nil {
		// 	return fmt.Errorf("invalid tokens sent '%s'", err)
		// }
		// if amountSent < uint64(math.Floor(minDepositBase)) {
		// 	return fmt.Errorf("sender did not send enough tokens to cover the listing fee")
		// }

		// Check that the user has enough tokens to sell
		var holderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, sender).First(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("sender does not have any tokens to sell")
		}

		if holderModel.Amount < uint64(amount) {
			return fmt.Errorf("sender does not have enough tokens to sell")
		}

		// At this point we know that the sender has enough tokens to sell
		// so decrease the senders balance
		holderModel.Amount = holderModel.Amount - uint64(amount)
		result = protocol.db.Save(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update seller's balance '%s'", err)
		}

		// Create a listing position
		listing := models.MarketplaceListing{
			ChainID:          parsedURN.ChainID,
			TransactionID:    currentTransaction.ID,
			SellerAddress:    sender,
			Total:            uint64(math.Round(totalBase)),
			DepositTotal:     uint64(math.Round(minDepositBase)),
			DepositorAddress: "",
			DepositTimeout:   timeout,
			IsDeposited:      false,
			IsFilled:         false,
			IsCancelled:      false,
			DateUpdated:      currentTransaction.DateCreated,
			DateCreated:      currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listing)
		if result.Error != nil {
			return fmt.Errorf("unable to create listing '%s'", result.Error)
		}

		listingDetail := models.MarketplaceCFT20Detail{
			ListingID:   listing.ID,
			TokenID:     tokenModel.ID,
			Amount:      uint64(math.Round(amount)),
			PPT:         uint64(math.Round(ppt)),
			DateCreated: currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listingDetail)
		if result.Error != nil {
			return fmt.Errorf("unable to create token listing '%s'", result.Error)
		}

		// Record the transfer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        currentTransaction.Height,
			TransactionID: currentTransaction.ID,
			TokenID:       tokenModel.ID,
			Sender:        sender,
			Receiver:      destinationAddress,
			Action:        "list",
			Amount:        uint64(math.Round(amount)),
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			// If we can't store the history, that fine, we shouldn't fail
			_ = result
		}

		// Record the listing history
		listingHistory := models.MarketplaceListingHistory{
			ListingID:     listing.ID,
			TransactionID: currentTransaction.ID,
			SenderAddress: sender,
			Action:        "list",
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listingHistory)
		if result.Error != nil {
			// If we can't store the history, that is fine, we shouldn't fail
			return nil
		}

	case "list.inscription":
		// TODO: Implement
	case "deposit":
		action := "deposit"
		hash := strings.TrimSpace(parsedURN.KeyValuePairs["h"])

		// Deposits are based on the listing transaction hash, find the transaction
		// and matching listing
		var transactionModel models.Transaction
		result := protocol.db.Where("hash = ?", hash).First(&transactionModel)
		if result.Error != nil {
			return fmt.Errorf("no listing transaction with hash '%s'", hash)
		}

		// Fetch listing based on hash
		var listingModel models.MarketplaceListing
		result = protocol.db.Where("chain_id = ? AND transaction_id = ?", parsedURN.ChainID, transactionModel.ID).First(&listingModel)
		if result.Error != nil {
			return fmt.Errorf("no listing with hash '%s'", hash)
		}

		if listingModel.IsDeposited {
			if listingModel.DepositorTimeoutBlock > currentHeight {
				return fmt.Errorf("listing already has a deposit")
			}
			// Has deposit, but expired, so we continue
			action = "deposit after expiry"
		}

		// Check if sender has enough ATOM to buy the listing
		balance := QueryAddressBalance(protocol.lcdEndpoints, protocol.endpointHeaders, sender, "uatom")

		if listingModel.Total >= listingModel.DepositTotal {
			if balance < listingModel.Total-listingModel.DepositTotal {
				return fmt.Errorf("sender does not have enough ATOM to complete the purchase after deposit")
			}
		}

		// Check that the correct amount was sent with the deposit
		amountSent, err := GetBaseTokensSent(rawTransaction)
		if err != nil {
			return fmt.Errorf("invalid tokens sent '%s'", err)
		}

		if amountSent < listingModel.DepositTotal {
			return fmt.Errorf("sender did not send enough tokens to cover the deposit")
		}

		// Everything checks out, add this as the depositor
		listingModel.IsDeposited = true
		listingModel.DepositorAddress = sender
		listingModel.DateUpdated = currentTransaction.DateCreated
		// Timed-out block is the first block after the expiry period when the
		// listing is deemed expired
		listingModel.DepositorTimeoutBlock = currentHeight + listingModel.DepositTimeout + 1
		result = protocol.db.Save(&listingModel)
		if result.Error != nil {
			return result.Error
		}

		// Record the listing history
		listingHistory := models.MarketplaceListingHistory{
			ListingID:     listingModel.ID,
			TransactionID: currentTransaction.ID,
			SenderAddress: sender,
			Action:        action,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listingHistory)
		if result.Error != nil {
			// If we can't store the history, that is fine, we shouldn't fail
			return nil
		}

	case "delist":
		action := "delist"
		hash := strings.TrimSpace(parsedURN.KeyValuePairs["h"])

		// Deposits are based on the listing transaction hash, find the transaction
		// and matching listing
		var transactionModel models.Transaction
		result := protocol.db.Where("hash = ?", hash).First(&transactionModel)
		if result.Error != nil {
			return fmt.Errorf("no listing transaction with hash '%s'", hash)
		}

		// Fetch listing based on hash
		var listingModel models.MarketplaceListing
		result = protocol.db.Where("chain_id = ? AND transaction_id = ?", parsedURN.ChainID, transactionModel.ID).First(&listingModel)
		if result.Error != nil {
			return fmt.Errorf("no listing with hash '%s'", hash)
		}

		if listingModel.SellerAddress != sender {
			return fmt.Errorf("sender is not the seller of the listing")
		}

		if listingModel.IsDeposited {
			if listingModel.DepositorTimeoutBlock > currentHeight {
				return fmt.Errorf("listing already has a deposit, cannot be cancelled until expiry")
			}
			// Has deposit, but expired, so we continue
			action = "delist after expiry"
		}

		if listingModel.IsFilled {
			return fmt.Errorf("listing has already been filled, cannot be cancelled")
		}
		if listingModel.IsCancelled {
			return fmt.Errorf("listing has already been cancelled")
		}

		listingModel.IsDeposited = false
		listingModel.DepositorAddress = ""
		listingModel.DepositorTimeoutBlock = 0
		listingModel.IsCancelled = true
		listingModel.DateUpdated = currentTransaction.DateCreated
		result = protocol.db.Save(&listingModel)
		if result.Error != nil {
			return fmt.Errorf("unable to cancel listing: %s", result.Error)
		}

		// Update listing history
		listingHistory := models.MarketplaceListingHistory{
			ListingID:     listingModel.ID,
			TransactionID: currentTransaction.ID,
			SenderAddress: sender,
			Action:        action,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listingHistory)
		if result.Error != nil {
			// If we can't store the history, that is fine, we shouldn't fail
			return nil
		}

		// Check if this is a CFT-20 token listing
		var listingDetailModel models.MarketplaceCFT20Detail
		result = protocol.db.Where("listing_id = ?", listingModel.ID).First(&listingDetailModel)
		if result.Error == nil {
			// This is CFT-20 listing, continue by returning funds
			var holderModel models.TokenHolder
			result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, listingDetailModel.TokenID, sender).First(&holderModel)
			if result.Error != nil {
				return fmt.Errorf("sender never had tokens to sell")
			}

			holderModel.Amount = holderModel.Amount + listingDetailModel.Amount
			result = protocol.db.Save(&holderModel)
			if result.Error != nil {
				return fmt.Errorf("unable to update seller's balance '%s'", err)
			}

			// Log history

			// Record the transfer
			historyModel := models.TokenAddressHistory{
				ChainID:       parsedURN.ChainID,
				Height:        currentTransaction.Height,
				TransactionID: currentTransaction.ID,
				TokenID:       listingDetailModel.TokenID,
				Sender:        protocol.virtualAddress,
				Receiver:      sender,
				Action:        action,
				Amount:        uint64(listingDetailModel.Amount),
				DateCreated:   currentTransaction.DateCreated,
			}
			result = protocol.db.Save(&historyModel)
			if result.Error != nil {
				// If we can't store the history, that fine, we shouldn't fail
				return nil
			}

		}

	case "buy.cft20":
		action := "buy"
		hash := strings.TrimSpace(parsedURN.KeyValuePairs["h"])

		// Buys are based on the listing transaction hash, find the transaction
		// and matching listing
		var transactionModel models.Transaction
		result := protocol.db.Where("hash = ?", hash).First(&transactionModel)
		if result.Error != nil {
			return fmt.Errorf("no listing transaction with hash '%s'", hash)
		}

		// Fetch listing based on hash
		var listingModel models.MarketplaceListing
		result = protocol.db.Where("chain_id = ? AND transaction_id = ?", parsedURN.ChainID, transactionModel.ID).First(&listingModel)
		if result.Error != nil {
			return fmt.Errorf("no listing with hash '%s'", hash)
		}

		// Fetch CFT-20 listing detail
		var listingDetailModel models.MarketplaceCFT20Detail
		result = protocol.db.Where("listing_id = ?", listingModel.ID).First(&listingDetailModel)
		if result.Error != nil {
			return fmt.Errorf("no CFT-20 listing with hash '%s'", hash)
		}

		if listingModel.IsDeposited {
			if listingModel.DepositorAddress != sender {
				return fmt.Errorf("sender is not the depositor of the listing, buyer must deposit first")
			}
		} else {
			return fmt.Errorf("listing has not been deposited, buyer must deposit first")
		}

		// Check the amount still owed after deposit
		amountOwed := listingModel.Total - listingModel.DepositTotal

		// Check that the correct amount was sent with the buy
		amountSent, err := GetBaseTokensSent(rawTransaction)
		if err != nil {
			return fmt.Errorf("invalid tokens sent '%s'", err)
		}

		if amountSent < amountOwed {
			return fmt.Errorf("sender did not send enough tokens to complete the buy")
		}

		// Verify that the sender sent enough to cover the feee
		// Get amount owed with decimals
		amountOwedWithDecimals := float64(amountOwed) / math.Pow10(6)
		requiredFee := amountOwedWithDecimals * protocol.tradeFee
		requiredFeeAbsolute := requiredFee * math.Pow10(6)
		if requiredFeeAbsolute < 1 {
			requiredFeeAbsolute = 1
		}

		// Verify that the sender has sent enough tokens to cover the fee
		amountSent, err = GetBaseTokensSentIBC(rawTransaction)
		if err != nil {
			return fmt.Errorf("invalid tokens sent '%s'", err)
		}
		if amountSent < uint64(math.Floor(requiredFeeAbsolute)) {
			return fmt.Errorf("sender did not send enough tokens to cover the purchase fee")
		}

		// Everything checks out, complete the buy and transfer the tokens to the buyer
		listingModel.IsFilled = true
		listingModel.DateUpdated = currentTransaction.DateCreated
		result = protocol.db.Save(&listingModel)
		if result.Error != nil {
			return result.Error
		}

		// Check if the receiver has any tokens already, if not, add
		var holderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, listingDetailModel.TokenID, sender).First(&holderModel)
		if result.Error != nil {
			// Just means this buyer doesn't have the tokens in their wallet yet
			_ = result
		}

		holderModel.ChainID = parsedURN.ChainID
		holderModel.TokenID = listingDetailModel.TokenID
		holderModel.Address = sender
		holderModel.Amount = holderModel.Amount + listingDetailModel.Amount
		holderModel.DateUpdated = currentTransaction.DateCreated
		result = protocol.db.Save(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update buyer's balance '%s'", err)
		}

		// Record the listing history
		listingHistory := models.MarketplaceListingHistory{
			ListingID:     listingModel.ID,
			TransactionID: currentTransaction.ID,
			SenderAddress: sender,
			Action:        action,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&listingHistory)
		if result.Error != nil {
			// If we can't store the history, that is fine, we shouldn't fail
			return nil
		}

		// Record the transfer from marketplace to buyer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        currentTransaction.Height,
			TransactionID: currentTransaction.ID,
			TokenID:       listingDetailModel.TokenID,
			Sender:        protocol.virtualAddress,
			Receiver:      sender,
			Action:        "buy",
			Amount:        listingDetailModel.Amount,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			// If we can't store the history, that fine, we shouldn't fail
			_ = result
		}

		// Record the sale of the tokens for the seller
		historyModel = models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        currentTransaction.Height,
			TransactionID: currentTransaction.ID,
			TokenID:       listingDetailModel.TokenID,
			Sender:        listingModel.SellerAddress,
			Receiver:      sender,
			Action:        "sell",
			Amount:        listingDetailModel.Amount,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			// If we can't store the history, that fine, we shouldn't fail
			_ = result
		}

		// Get current USD price of the base
		var statusModel models.Status
		result = protocol.db.Where("chain_id = ?", parsedURN.ChainID).First(&statusModel)
		if result.Error != nil {
			// If this fails we just don't update the history
			return nil
		}

		// Capture the trade in the history for future charts
		totalWithDecimals := float64(listingModel.Total) / math.Pow10(6)
		tradeHistory := models.TokenTradeHistory{
			ChainID:       parsedURN.ChainID,
			TransactionID: currentTransaction.ID,
			TokenID:       listingDetailModel.TokenID,
			SellerAddress: listingModel.SellerAddress,
			BuyerAddress:  sender,
			AmountQuote:   listingModel.Total,        // ATOM
			AmountBase:    listingDetailModel.Amount, // CFT-20
			Rate:          listingDetailModel.PPT,
			TotalUSD:      totalWithDecimals * statusModel.BaseTokenUSD,
			DateCreated:   currentTransaction.DateCreated,
		}
		result = protocol.db.Save(&tradeHistory)
		if result.Error != nil {
			// Continue, this is not critical
			_ = result
		}

		// Check if the ticker exists
		var tokenModel models.Token
		result = protocol.db.Where("id = ?", listingDetailModel.TokenID).First(&tokenModel)
		if result.Error != nil {
			// This can fail silently as to not alarm the user
			return nil
		}

		// Recalculate volume from filled trades for this token in past 24 hours
		// SELECT sum(total_usd) from token_trade_history where date_Created >= now - 24 hours and token_id = this token id
		var sum uint64
		err = protocol.db.Model(&models.TokenTradeHistory{}).
			Select("SUM(amount_quote)").
			Where("date_created >= ?", time.Now().Add(-24*time.Hour)).
			Where("token_id = ?", tokenModel.ID).
			Find(&sum).Error

		if err != nil {
			// This can fail silently as to not alarm the user
			return nil
		}

		tokenModel.Volume24Base = sum
		result = protocol.db.Save(&tokenModel)
		if result.Error != nil {
			// This can fail silently as to not alarm the user
			return nil
		}

	}

	return nil
}
