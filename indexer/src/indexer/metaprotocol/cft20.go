package metaprotocol

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/leodido/go-urn"
)

type CFT20 struct {
	// Define protocol rules
	nameMinLength          int
	nameMaxLength          int
	tickerMinLength        int
	tickerMaxLength        int
	decimalsMaxValue       uint
	maxSupplyMaxValue      uint64
	perWalletLimitMaxValue uint64
}

func NewCFT20Processor() *CFT20 {
	return &CFT20{
		nameMinLength:          3,
		nameMaxLength:          32,
		tickerMinLength:        3,
		tickerMaxLength:        5,
		decimalsMaxValue:       18,
		maxSupplyMaxValue:      math.MaxUint64,
		perWalletLimitMaxValue: math.MaxUint64,
	}
}

func (protocol *CFT20) Name() string {
	return "cft20"
}

func (protocol *CFT20) Process(protocolURN *urn.URN, rawTransaction types.RawTransaction) ([]interface{}, error) {
	var dataModels []interface{}

	// TODO: Turn the common extraction into helper functions

	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return dataModels, err
	}

	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;deploy$nam=The Name,tic=TICK,sup=21000000,dec=6,lim=1000
	// cosmoshub-4@v1beta;deploy$nam=NewYearDay,tic=NYD,sup=28000000,dec=18,lim=50000,opn=1704059940
	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return dataModels, err
	}

	name := strings.TrimSpace(parsedURN.KeyValuePairs["nam"])
	ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
	ticker = strings.ToUpper(ticker)

	supply, err := strconv.ParseUint(parsedURN.KeyValuePairs["sup"], 10, 64)
	if err != nil {
		return dataModels, fmt.Errorf("unable to parse supply '%s'", err)
	}
	decimals, err := strconv.ParseUint(parsedURN.KeyValuePairs["dec"], 10, 64)
	if err != nil {
		return dataModels, fmt.Errorf("unable to parse decimals '%s'", err)
	}
	limit, err := strconv.ParseUint(parsedURN.KeyValuePairs["lim"], 10, 64)
	if err != nil {
		return dataModels, fmt.Errorf("unable to parse limit '%s'", err)
	}

	openTimestamp, err := strconv.ParseUint(parsedURN.KeyValuePairs["opn"], 10, 64)
	if err != nil {
		// If this fails, we set the open time to the block time
		openTimestamp = uint64(rawTransaction.TxResponse.Timestamp.Unix())
	}

	// Add the decimals to the supply and limit
	supply = supply * uint64(math.Pow10(int(decimals)))
	limit = limit * uint64(math.Pow10(int(decimals)))

	height, err := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)
	if err != nil {
		return dataModels, fmt.Errorf("unable to parse height '%s'", err)
	}

	// // Store the content with the correct mime type on DO
	// contentPath, err := protocol.storeContent(inscriptionMetadata, rawTransaction.TxResponse.Txhash, content)
	// if err != nil {
	// 	return dataModels, fmt.Errorf("unable to store content '%s'", err)
	// }

	// Create the inscription model
	dataModels = append(dataModels, models.Token{
		ChainID:         parsedURN.chainID,
		Height:          height,
		Version:         parsedURN.version,
		TransactionHash: rawTransaction.TxResponse.Txhash,
		Creator:         sender,
		CurrentOwner:    sender,
		Name:            name,
		Ticker:          ticker,
		Decimals:        decimals,
		MaxSupply:       supply,
		PerWalletLimit:  limit,
		LaunchTimestamp: openTimestamp,
		// MintPage: ,
		// Metadata:         datatypes.JSON(metadata),
		// ContentPath:      contentPath,
		// ContentSizeBytes: uint64(len(content)),
		DateCreated: rawTransaction.TxResponse.Timestamp,
	})

	return dataModels, nil
}

// storeContent stores the content in the S3 bucket
func (protocol *CFT20) storeContent(metadata InscriptionMetadata, txHash string, content []byte) (string, error) {
	// ext, err := mime.ExtensionsByType(metadata.Metadata.Mime)
	// if err != nil {
	// 	// We could not find the mime type, so we default to .bin
	// 	ext = []string{".bin"}
	// }

	// endpoint := protocol.s3Endpoint
	// region := protocol.s3Region
	// sess := session.Must(session.NewSession(&aws.Config{
	// 	Endpoint:    &endpoint,
	// 	Region:      &region,
	// 	Credentials: credentials.NewStaticCredentials(protocol.s3ID, protocol.s3Secret, protocol.s3Token),
	// }))

	// // Create an uploader with the session and default options
	// uploader := s3manager.NewUploader(sess)

	// // Upload the file to an S3 compatible bucket
	// myBucket := protocol.s3Bucket
	// filename := txHash + ext[0]
	// uploadResult, err := uploader.Upload(&s3manager.UploadInput{
	// 	ACL:    aws.String("public-read"),
	// 	Bucket: aws.String(myBucket),
	// 	Key:    aws.String(filename),
	// 	Body:   bytes.NewReader(content),
	// })
	// if err != nil {
	// 	return "", fmt.Errorf("failed to upload file, %v", err)
	// }

	// return aws.StringValue(&uploadResult.Location), nil
	return "", nil
}
