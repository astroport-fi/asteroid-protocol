package metaprotocol

import (
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type MarketplaceConfig struct {
	MinimumTimeoutBlocks uint64 `envconfig:"MARKET_MIN_TIMEOUT" required:"true"`

	LCDEndpoints    []string          `envconfig:"LCD_ENDPOINTS" required:"true"`
	EndpointHeaders map[string]string `envconfig:"ENDPOINT_HEADERS" required:"true"`
}

type Marketplace struct {
	chainID              string
	version              string
	virtualAddress       string
	minimumTimeoutBlocks uint64
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
		db:                   db,
		lcdEndpoints:         config.LCDEndpoints,
		endpointHeaders:      config.EndpointHeaders,
	}
}

func (protocol *Marketplace) Name() string {
	return "marketplace"
}

func (protocol *Marketplace) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
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

	currentHeight := transactionModel.Height

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

		// Calculate the ATOM amount of the minimum deposit by checking against
		// totalBase
		minDepositBase := minDeposit * totalBase

		// Get the listing timeout
		timeoutString := strings.TrimSpace(parsedURN.KeyValuePairs["to"])
		timeout, err := strconv.ParseUint(timeoutString, 10, 64)
		if err != nil {
			return fmt.Errorf("unable to parse to '%s'", err)
		}
		if timeout < protocol.minimumTimeoutBlocks {
			return fmt.Errorf("timeout must be greater than the minimum of %d", protocol.minimumTimeoutBlocks)
		}

		// // Verify that the sender has sent enough tokens to cover the listing fee
		// amountSent, err := GetBaseTokensSentIBC(rawTransaction)
		// if err != nil {
		// 	return fmt.Errorf("invalid tokens sent '%s'", err)
		// }
		// if amountSent < uint64(math.Round(minDepositBase)) {
		// 	return fmt.Errorf("sender did not send enough tokens to cover the listing fee")
		// }

		// Verify that the sender has sent enough tokens to cover the listing fee
		amountSent, err := GetBaseTokensSent(rawTransaction)
		if err != nil {
			return fmt.Errorf("invalid tokens sent '%s'", err)
		}
		if amountSent < uint64(math.Round(minDepositBase)) {
			return fmt.Errorf("sender did not send enough tokens to cover the listing fee")
		}

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
			TransactionID:    transactionModel.ID,
			SellerAddress:    sender,
			Total:            uint64(math.Round(totalBase)),
			DepositTotal:     uint64(math.Round(minDepositBase)),
			DepositorAddress: "",
			DepositTimeout:   timeout,
			IsDeposited:      false,
			IsFilled:         false,
			IsCancelled:      false,
			DateUpdated:      transactionModel.DateCreated,
			DateCreated:      transactionModel.DateCreated,
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
			DateCreated: transactionModel.DateCreated,
		}
		result = protocol.db.Save(&listingDetail)
		if result.Error != nil {
			return fmt.Errorf("unable to create token listing '%s'", result.Error)
		}

		// Record the transfer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			Sender:        sender,
			Receiver:      destinationAddress,
			Action:        "list",
			Amount:        uint64(math.Round(amount)),
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			// If we can't store the history, that ED39F0355A87799E603E0E646A174B860C222E757807833E87036CF2846F9F45is fine, we shouldn't fail
			return nil
		}

		// Record the listing history
		listingHistory := models.MarketplaceListingHistory{
			ListingID:     listing.ID,
			SenderAddress: sender,
			Action:        "list",
			DateCreated:   transactionModel.DateCreated,
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
		result := protocol.db.Debug().Where("hash = ?", hash).First(&transactionModel)
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
		if balance < listingModel.Total-listingModel.DepositTotal {
			return fmt.Errorf("sender does not have enough ATOM to complete the purchase after deposit")
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
			SenderAddress: sender,
			Action:        action,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&listingHistory)
		if result.Error != nil {
			// If we can't store the history, that is fine, we shouldn't fail
			return nil
		}

	case "delist":
		fmt.Println("DELIST")
	case "buy":
		fmt.Println("BUY")
	}

	return nil
}
