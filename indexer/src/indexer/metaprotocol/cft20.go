package metaprotocol

import (
	"bytes"
	"fmt"
	"log"
	"math"
	"mime"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type CFT20Config struct {
	S3Endpoint string `envconfig:"S3_ENDPOINT" required:"true"`
	S3Region   string `envconfig:"S3_REGION" required:"true"`
	S3Bucket   string `envconfig:"S3_BUCKET"`
	S3ID       string `envconfig:"S3_ID" required:"true"`
	S3Secret   string `envconfig:"S3_SECRET" required:"true"`
	S3Token    string `envconfig:"S3_TOKEN"`
}

type CFT20 struct {
	chainID    string
	db         *gorm.DB
	s3Endpoint string
	s3Region   string
	s3Bucket   string
	// s3ID is the S3 credentials ID
	s3ID string
	// s3Secret is the S3 credentials secret
	s3Secret string
	// s3Token is the S3 credentials token
	s3Token string
	// Define protocol rules
	nameMinLength          int
	nameMaxLength          int
	tickerMinLength        int
	tickerMaxLength        int
	decimalsMaxValue       uint
	maxSupplyMaxValue      uint64
	perWalletLimitMaxValue uint64
}

func NewCFT20Processor(chainID string, db *gorm.DB) *CFT20 {
	// Parse config environment variables for self
	var config InscriptionConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &CFT20{
		chainID:                chainID,
		db:                     db,
		s3Endpoint:             config.S3Endpoint,
		s3Region:               config.S3Region,
		s3Bucket:               config.S3Bucket,
		s3ID:                   config.S3ID,
		s3Secret:               config.S3Secret,
		s3Token:                config.S3Token,
		nameMinLength:          1,
		nameMaxLength:          32,
		tickerMinLength:        1,
		tickerMaxLength:        10,
		decimalsMaxValue:       6,
		maxSupplyMaxValue:      10000000000000000000, // 10T
		perWalletLimitMaxValue: 10000000000000000000, // 10T
	}
}

func (protocol *CFT20) Name() string {
	return "cft20"
}

func (protocol *CFT20) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
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

	// TODO: Rework the operation handling
	switch parsedURN.Operation {
	case "deploy":
		name, err := url.QueryUnescape(strings.TrimSpace(parsedURN.KeyValuePairs["nam"]))
		if err != nil {
			return fmt.Errorf("unable to parse token name '%s'", err)
		}
		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		supplyFloat, err := strconv.ParseFloat(parsedURN.KeyValuePairs["sup"], 64)
		if err != nil {
			return fmt.Errorf("unable to parse supply '%s'", err)
		}
		if supplyFloat <= 0 {
			return fmt.Errorf("token supply must be greater than 0")
		}

		decimals, err := strconv.ParseUint(parsedURN.KeyValuePairs["dec"], 10, 64)
		if err != nil {
			return fmt.Errorf("unable to parse decimals '%s'", err)
		}
		limitFloat, err := strconv.ParseFloat(parsedURN.KeyValuePairs["lim"], 64)
		if err != nil {
			return fmt.Errorf("unable to parse limit '%s'", err)
		}
		if limitFloat <= 0 {
			return fmt.Errorf("token supply must be greater than 0")
		}

		openTimestamp, err := strconv.ParseUint(parsedURN.KeyValuePairs["opn"], 10, 64)
		if err != nil {
			// If this fails, we set the open time to the block time
			openTimestamp = uint64(transactionModel.DateCreated.Unix())
		}

		// Add the decimals to the supply and limit
		supplyFloat = supplyFloat * math.Pow10(int(decimals))
		supply := uint64(math.Round(supplyFloat))

		limitFloat = limitFloat * math.Pow10(int(decimals))
		limit := uint64(math.Round(limitFloat))

		// TODO: Rework validation
		// Validate some fields
		if len(name) < protocol.nameMinLength || len(name) > protocol.nameMaxLength {
			return fmt.Errorf("token name must be between %d and %d characters", protocol.nameMinLength, protocol.nameMaxLength)
		}
		if len(ticker) < protocol.tickerMinLength || len(ticker) > protocol.tickerMaxLength {
			return fmt.Errorf("token ticker must be between %d and %d characters", protocol.tickerMinLength, protocol.tickerMaxLength)
		}
		if decimals > uint64(protocol.decimalsMaxValue) {
			return fmt.Errorf("token decimals must be less than %d", protocol.decimalsMaxValue)
		}
		if supply > protocol.maxSupplyMaxValue {
			return fmt.Errorf("token supply must be less than %d", protocol.maxSupplyMaxValue)
		}
		// Minting limit may be at most 1% of supply
		maxMintLimit := supplyFloat * 0.01
		if limitFloat > maxMintLimit {
			return fmt.Errorf("the mint limit may not exceed 1%% of the total supply")
		}

		if limit > supply {
			return fmt.Errorf("token per wallet limit must be less than supply of %d", protocol.maxSupplyMaxValue)
		}

		// Check if this token has already been deployed
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error == nil {
			return fmt.Errorf("token with ticker '%s' already exists", ticker)
		}

		// TODO: Rework the content extraction
		contentPath := ""
		contentLength := 0
		// If this token includes content, we need to store it and add to the record
		if len(rawTransaction.Body.NonCriticalExtensionOptions) == 1 {
			// Logo is stored in the non_critical_extension_options
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

			inscriptionMetadata, err := msg.GetMetadata()
			if err != nil {
				return err
			}

			content, err := msg.GetContent()
			if err != nil {
				return err
			}

			// Store the content with the correct mime type on DO
			contentPath, err = protocol.storeContent(inscriptionMetadata, rawTransaction.Hash, content)
			if err != nil {
				return fmt.Errorf("unable to store content '%s'", err)
			}

			contentLength = len(content)
		}

		// Create the token model
		tokenModel = models.Token{
			ChainID:           parsedURN.ChainID,
			Height:            transactionModel.Height,
			Version:           parsedURN.Version,
			TransactionID:     transactionModel.ID,
			Creator:           sender,
			CurrentOwner:      sender,
			Name:              name,
			Ticker:            ticker,
			Decimals:          decimals,
			MaxSupply:         supply,
			PerMintLimit:      limit,
			LaunchTimestamp:   openTimestamp,
			ContentPath:       contentPath,
			ContentSizeBytes:  uint64(contentLength),
			DateCreated:       transactionModel.DateCreated,
			CirculatingSupply: 0,
		}

		result = protocol.db.Save(&tokenModel)
		if result.Error != nil {
			return result.Error
		}

	case "mint":
		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}
		// Check if the minted <= max supply
		if tokenModel.CirculatingSupply >= tokenModel.MaxSupply {
			return fmt.Errorf("token with ticker '%s' has reached max supply", ticker)
		}
		// Check if opn time < transaction time
		if tokenModel.LaunchTimestamp > uint64(transactionModel.DateCreated.Unix()) {
			return fmt.Errorf("token with ticker '%s' is not yet open for minting", ticker)
		}

		mintAmount := tokenModel.PerMintLimit
		if tokenModel.CirculatingSupply+mintAmount > tokenModel.MaxSupply {
			// Determine if there is anything left to mint
			mintAmount = tokenModel.MaxSupply - tokenModel.CirculatingSupply
		}

		// Add to tx history, we do this first so that if this tx has been processed
		// we don't alter anything else
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			Sender:        tokenModel.Ticker,
			Receiver:      sender,
			Action:        "mint",
			Amount:        mintAmount,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			return result.Error
		}

		// Update token circulating
		tokenModel.CirculatingSupply = tokenModel.CirculatingSupply + mintAmount
		result = protocol.db.Save(&tokenModel)
		if result.Error != nil {
			return result.Error
		}

		// Update user balance
		var holderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, sender).First(&holderModel)
		if result.Error != nil {
			if result.Error != gorm.ErrRecordNotFound {
				return result.Error
			}
		}

		holderModel.ChainID = parsedURN.ChainID
		holderModel.TokenID = tokenModel.ID
		holderModel.Address = sender
		holderModel.Amount = holderModel.Amount + mintAmount
		holderModel.DateUpdated = transactionModel.DateCreated

		result = protocol.db.Save(&holderModel)
		if result.Error != nil {
			return result.Error
		}

	case "transfer":

		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		// Check required fields
		destinationAddress := strings.TrimSpace(parsedURN.KeyValuePairs["dst"])
		destinationAddress = strings.ToLower(destinationAddress)
		if len(destinationAddress) != 45 {
			return fmt.Errorf("cosmos hub addresses must be 45 characters long")
		}
		if !strings.Contains(destinationAddress, "cosmos1") {
			return fmt.Errorf("destination address does not look like a valid address")
		}

		amountString := strings.TrimSpace(parsedURN.KeyValuePairs["amt"])
		// Convert amount to have the correct number of decimals
		amount, err := strconv.ParseUint(amountString, 10, 64)
		if err != nil {
			return fmt.Errorf("unable to parse amount '%s'", err)
		}
		if amount == 0 {
			return fmt.Errorf("amount must be greater than 0")
		}

		amount = amount * uint64(math.Pow10(int(tokenModel.Decimals)))

		// Check that the user has enough tokens to transfer
		var holderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, sender).First(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("sender does not have any tokens to transfer")
		}

		if holderModel.Amount < amount {
			return fmt.Errorf("sender does not have enough tokens to transfer")
		}

		// At this point we know that the sender has enough tokens to transfer
		// so update the sender's balance
		holderModel.Amount = holderModel.Amount - amount
		result = protocol.db.Save(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update sender balance '%s'", err)
		}

		// Check if the destination address has any tokens
		var destinationHolderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, destinationAddress).First(&destinationHolderModel)
		if result.Error != nil {
			if result.Error != gorm.ErrRecordNotFound {
				return fmt.Errorf("unable to check destination balance '%s'", err)
			}
		}

		// If the destination address has no tokens, we need to create a record
		destinationHolderModel.ChainID = parsedURN.ChainID
		destinationHolderModel.TokenID = tokenModel.ID
		destinationHolderModel.Address = destinationAddress
		destinationHolderModel.Amount = destinationHolderModel.Amount + amount
		destinationHolderModel.DateUpdated = transactionModel.DateCreated

		result = protocol.db.Save(&destinationHolderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update receiver balance '%s'", err)
		}

		// Record the transfer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			Sender:        sender,
			Receiver:      destinationAddress,
			Action:        "transfer",
			Amount:        amount,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			return result.Error
		}

	case "list":

		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		// Set the destination address to the marketplace for transfer history
		destinationAddress := "marketplace"

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
		// so update the sender's balance
		holderModel.Amount = holderModel.Amount - uint64(amount)
		result = protocol.db.Save(&holderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update seller's balance '%s'", err)
		}

		// Create a sell position
		positionModel := models.TokenOpenPosition{
			ChainID:       parsedURN.ChainID,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			SellerAddress: sender,
			Amount:        uint64(math.Round(amount)),
			PPT:           uint64(math.Round(ppt)),
			Total:         uint64(math.Round(totalBase)),
			DateCreated:   transactionModel.DateCreated,
		}

		result = protocol.db.Save(&positionModel)
		if result.Error != nil {
			return fmt.Errorf("unable to create sell position '%s'", result.Error)
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
			return result.Error
		}

	case "buy":

		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		orderNumber := strings.TrimSpace(parsedURN.KeyValuePairs["ord"])

		// Check if the order still exists
		var openOrderModel models.TokenOpenPosition
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND id = ? AND is_filled = ? AND is_cancelled = ?", parsedURN.ChainID, tokenModel.ID, orderNumber, false, false).First(&openOrderModel)
		if result.Error != nil {
			return fmt.Errorf("order by id '%s' doesn't exist", orderNumber)
		}

		// Check if the amount sent >= amount required
		for _, v := range rawTransaction.Body.Messages {
			if v.Type == "/cosmos.bank.v1beta1.MsgSend" {
				// The first send should hold the amount being used to buy the tokens with
				if v.Amount[0].Amount != fmt.Sprintf("%d", openOrderModel.Total) {
					return fmt.Errorf("incorrect amount sent to buy tokens, got %s, expected %d", v.Amount[0].Amount, openOrderModel.Total)
				}
				if v.Amount[0].Denom != "uatom" {
					return fmt.Errorf("incorrect denom sent to buy tokens, got %s, expected uatom", v.Amount[0].Denom)
				}
				if v.ToAddress != openOrderModel.SellerAddress {
					return fmt.Errorf("attempting to buy from incorrect seller")
				}
				break
			}
		}

		// Get current USD price of the base
		var statusModel models.Status
		result = protocol.db.Where("chain_id = ?", parsedURN.ChainID).First(&statusModel)
		if result.Error != nil {
			return fmt.Errorf("unable to get current base currency price '%s'", err)
		}

		// We no longer update the price from the previous market
		// tokenModel.LastPriceBase = openOrderModel.PPT
		// result = protocol.db.Save(&tokenModel)
		// if result.Error != nil {
		// 	return fmt.Errorf("unable to update token price '%s'", result.Error)
		// }

		// Everything checks out, so we can mark the order as filled and transfer the tokens
		openOrderModel.IsFilled = true
		openOrderModel.DateFilled = transactionModel.DateCreated
		result = protocol.db.Save(&openOrderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update order '%s'", result.Error)
		}

		// Update the buyer's balance
		// Check if the destination address has any tokens
		var destinationHolderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, sender).First(&destinationHolderModel)
		if result.Error != nil {
			if result.Error != gorm.ErrRecordNotFound {
				return fmt.Errorf("unable to check destination balance '%s'", result.Error)
			}
		}

		// If the destination address has no tokens, we need to create a record
		destinationHolderModel.ChainID = parsedURN.ChainID
		destinationHolderModel.TokenID = tokenModel.ID
		destinationHolderModel.Address = sender
		destinationHolderModel.Amount = destinationHolderModel.Amount + openOrderModel.Amount
		destinationHolderModel.DateUpdated = transactionModel.DateCreated

		result = protocol.db.Save(&destinationHolderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update receiver balance '%s'", err)
		}

		// Record the transfer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			Sender:        "marketplace",
			Receiver:      sender,
			Action:        "buy",
			Amount:        openOrderModel.Amount,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			return result.Error
		}

		totalWithDecimals := float64(openOrderModel.Total) / math.Pow10(6)

		// Capture the trade in the history for future charts
		tradeHistory := models.TokenTradeHistory{
			ChainID:       parsedURN.ChainID,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			SellerAddress: openOrderModel.SellerAddress,
			BuyerAddress:  sender,
			AmountQuote:   openOrderModel.Total,  // ATOM
			AmountBase:    openOrderModel.Amount, // CFT-20
			Rate:          openOrderModel.PPT,
			TotalUSD:      totalWithDecimals * statusModel.BaseTokenUSD,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&tradeHistory)
		if result.Error != nil {
			return result.Error
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
			// No need to alert the buyer
			return nil
		}

		tokenModel.Volume24Base = sum
		result = protocol.db.Save(&tokenModel)
		if result.Error != nil {
			// No need to alert the buyer
			return nil
		}

	case "delist":

		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)

		// Check if the ticker exists
		var tokenModel models.Token
		result := protocol.db.Where("chain_id = ? AND ticker = ?", parsedURN.ChainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		orderNumber := strings.TrimSpace(parsedURN.KeyValuePairs["ord"])

		// Check if the order still exists
		var openOrderModel models.TokenOpenPosition
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND id = ? AND is_filled = ? AND is_cancelled = ?", parsedURN.ChainID, tokenModel.ID, orderNumber, false, false).First(&openOrderModel)
		if result.Error != nil {
			return fmt.Errorf("order by id '%s' doesn't exist", orderNumber)
		}

		// Check if the sender is the owner of the order
		if openOrderModel.SellerAddress != sender {
			return fmt.Errorf("only the seller can cancel an order")
		}

		// Everything checks out, so we can mark the order as cancelled
		openOrderModel.IsCancelled = true
		result = protocol.db.Save(&openOrderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update order '%s'", err)
		}

		// Return funds to seller
		// Check if the destination address has any tokens
		var destinationHolderModel models.TokenHolder
		result = protocol.db.Where("chain_id = ? AND token_id = ? AND address = ?", parsedURN.ChainID, tokenModel.ID, sender).First(&destinationHolderModel)
		if result.Error != nil {
			if result.Error != gorm.ErrRecordNotFound {
				return fmt.Errorf("unable to check destination balance '%s'", err)
			}
		}

		// If the destination address has no tokens, we need to create a record
		destinationHolderModel.ChainID = parsedURN.ChainID
		destinationHolderModel.TokenID = tokenModel.ID
		destinationHolderModel.Address = sender
		destinationHolderModel.Amount = destinationHolderModel.Amount + openOrderModel.Amount
		destinationHolderModel.DateUpdated = transactionModel.DateCreated

		result = protocol.db.Save(&destinationHolderModel)
		if result.Error != nil {
			return fmt.Errorf("unable to update receiver balance '%s'", err)
		}

		// Record the transfer
		historyModel := models.TokenAddressHistory{
			ChainID:       parsedURN.ChainID,
			Height:        transactionModel.Height,
			TransactionID: transactionModel.ID,
			TokenID:       tokenModel.ID,
			Sender:        "marketplace",
			Receiver:      sender,
			Action:        "delist",
			Amount:        openOrderModel.Amount,
			DateCreated:   transactionModel.DateCreated,
		}
		result = protocol.db.Save(&historyModel)
		if result.Error != nil {
			return result.Error
		}
	}

	return nil
}

// TODO: This is reused, move to common helpers
// storeContent stores the content in the S3 bucket
func (protocol *CFT20) storeContent(metadata *types.InscriptionMetadata, txHash string, content []byte) (string, error) {
	ext, err := mime.ExtensionsByType(metadata.Metadata.Mime)
	if err != nil {
		// We could not find the mime type, so we default to .bin
		ext = []string{".bin"}
	}
	if len(ext) == 0 {
		// We could not find the mime type, so we default to .bin
		ext = []string{".bin"}
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
