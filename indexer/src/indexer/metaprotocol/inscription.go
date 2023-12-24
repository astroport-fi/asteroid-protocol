package metaprotocol

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"mime"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/leodido/go-urn"
	"gorm.io/datatypes"
)

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

func NewInscriptionProcessor(s3Endpoint string, s3Region string, s3Bucket string, s3ID string, s3Secret string, s3Token string) *Inscription {
	return &Inscription{
		s3Endpoint: s3Endpoint,
		s3Region:   s3Region,
		s3Bucket:   s3Bucket,
		s3ID:       s3ID,
		s3Secret:   s3Secret,
		s3Token:    s3Token,
	}
}

func (protocol *Inscription) Name() string {
	return "Inscription"
}

func (protocol *Inscription) Process(protocolURN *urn.URN, rawTransaction types.RawTransaction) ([]interface{}, error) {
	var dataModels []interface{}

	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return dataModels, err
	}

	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;inscribe$h=c4749f95902411d1a45a033d8a6b3e6aa0de0a0028fe8737f66fed6834dce8bf
	sourceContent := strings.Split(protocolURN.SS, ";")
	if len(sourceContent) != 2 {
		return dataModels, fmt.Errorf("invalid source/content split: %s", protocolURN.SS)
	}

	// Parse cosmoshub-4@v1beta
	sourceVersioning := strings.Split(sourceContent[0], "@")
	if len(sourceVersioning) != 2 {
		return dataModels, fmt.Errorf("incorrect source versioning parts: %s", protocolURN.SS)
	}
	chainID := sourceVersioning[0]
	version := sourceVersioning[1]

	// Parse inscribe$h=...contenthash...
	opContent := strings.Split(sourceContent[1], "$")
	if len(opContent) != 2 {
		return dataModels, fmt.Errorf("invalid op/content parts: %s", protocolURN.SS)
	}
	operation := opContent[0]

	// TODO: Split off based on operation
	fmt.Println("Got operation: ", operation)

	// Parse h=...contenthash...
	// Parse key=value,key=value
	keyValuePairs := make(map[string]string)
	keyValuePairsString := strings.Split(opContent[1], ",")
	for _, keyValuePair := range keyValuePairsString {
		keyValue := strings.Split(keyValuePair, "=")
		keyValuePairs[keyValue[0]] = keyValue[1]
	}
	contentHash := keyValuePairs["h"]

	// Inscription metadata is stored in the non_critical_extension_options
	// section of the transaction
	var metadata []byte
	var content []byte
	for _, extension := range rawTransaction.Tx.Body.NonCriticalExtensionOptions {
		// The type of the option must be MsgRevoke
		if extension.Type == "/cosmos.authz.v1beta1.MsgRevoke" {
			// The granter field contains the metadata
			metadata, err = base64.StdEncoding.DecodeString(extension.Granter)
			if err != nil {
				return dataModels, fmt.Errorf("unable to decode granter metadata '%s'", err)
			}

			// The grantee field contains the content base64
			content, err = base64.StdEncoding.DecodeString(extension.Grantee)
			if err != nil {
				return dataModels, fmt.Errorf("unable to decode grantee content '%s'", err)
			}

			// We only process the first extension option
			break
		}
	}

	var inscriptionMetadata InscriptionMetadata
	err = json.Unmarshal(metadata, &inscriptionMetadata)
	if err != nil {
		return dataModels, fmt.Errorf("unable to unmarshal metadata '%s'", err)
	}

	// fmt.Println("Sendder", sender)
	// fmt.Println("Got chainID: ", chainID)
	// fmt.Println("Got version: ", version)
	// fmt.Println("Got operation: ", operation)
	// fmt.Println("Got hash: ", contentHash)

	// fmt.Println("Got metadata: ", string(metadata))
	// _ = inscriptionMetadata
	// _ = content
	// fmt.Println("Got parent: ", inscriptionMetadata.Parent.Identifier)
	// fmt.Println("Got name: ", inscriptionMetadata.Metadata.Name)
	// fmt.Println("Got mime: ", inscriptionMetadata.Metadata.Mime)
	// fmt.Println("Got byte length: ", len(content))

	height, err := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)
	if err != nil {
		return dataModels, fmt.Errorf("unable to parse height '%s'", err)
	}

	// Store the content with the correct mime type on DO
	contentPath, err := protocol.storeContent(inscriptionMetadata, rawTransaction.TxResponse.Txhash, content)
	if err != nil {
		return dataModels, fmt.Errorf("unable to store content '%s'", err)
	}

	// Create the inscription model
	dataModels = append(dataModels, models.Inscription{
		ChainID:          chainID,
		Height:           height,
		Version:          version,
		TransactionHash:  rawTransaction.TxResponse.Txhash,
		ContentHash:      contentHash,
		Creator:          sender,
		CurrentOwner:     sender,
		Type:             "content",
		Metadata:         datatypes.JSON(metadata),
		ContentPath:      contentPath,
		ContentSizeBytes: uint64(len(content)),
		DateCreated:      rawTransaction.TxResponse.Timestamp,
	})

	return dataModels, nil
}

// storeContent stores the content in the S3 bucket
func (protocol *Inscription) storeContent(metadata InscriptionMetadata, txHash string, content []byte) (string, error) {
	ext, err := mime.ExtensionsByType(metadata.Metadata.Mime)
	if err != nil {
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
		ACL:    aws.String("public-read"),
		Bucket: aws.String(myBucket),
		Key:    aws.String(filename),
		Body:   bytes.NewReader(content),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file, %v", err)
	}

	return aws.StringValue(&uploadResult.Location), nil
}
