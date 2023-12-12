package indexer

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"mime"
	"strconv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
)

func (i *Indexer) processInscription(rawTransaction RawTransaction) error {
	i.logger.Debug("Processing Inscription:", rawTransaction.TxResponse.Txhash)

	// TODO: Check for a duplicate of the content
	// rawTransaction.Tx.Body.NonCriticalExtensionOptions

	// Determine creator and owner of the inscription
	// We determine the creator as the sender of the first MsgSend message
	// in messages

	// Ensure this transaction has at least 1 message
	// As far as I know the SDK doesn't allow this, but we should check anyway
	if len(rawTransaction.Tx.Body.Messages) == 0 {
		return fmt.Errorf("No messages in transaction")
	}

	// Get the first transaction message
	firstMessage := rawTransaction.Tx.Body.Messages[0]
	sender := firstMessage.FromAddress

	// TODO Decode the inscription
	for _, extension := range rawTransaction.Tx.Body.NonCriticalExtensionOptions {
		fmt.Println(extension.MsgTypeURL)

		switch extension.MsgTypeURL {
		case InscriptionTypeContentGeneric:
			fmt.Println("Generic inscription")
			// Decode metadata for this type of inscription
			metadataBytes, err := base64.StdEncoding.DecodeString(extension.Granter)
			if err != nil {
				return err
			}

			fmt.Println(string(metadataBytes))
			var genericMetadata ContentGenericMetadata
			err = json.Unmarshal(metadataBytes, &genericMetadata)
			if err != nil {
				return err
			}

			// Decode content to store on the disk
			contentBytes, err := base64.StdEncoding.DecodeString(extension.Grantee)
			if err != nil {
				return err
			}

			parentJSON, err := json.Marshal(genericMetadata.Parent)
			if err != nil {
				return err
			}

			// For this type of inscription, the sender is the creator and owner
			fmt.Println("creator", sender)
			fmt.Println("owner", sender)
			fmt.Println(genericMetadata.Parent.Type)
			fmt.Println(genericMetadata.Parent.Identifier)
			fmt.Println(genericMetadata.Metadata.Name)

			ext, _ := mime.ExtensionsByType(genericMetadata.Metadata.MIME)
			fmt.Println("MIME", genericMetadata.Metadata.MIME)
			fmt.Println(fmt.Sprintf("Filename: inscription%s", ext))

			endpoint := "ams3.digitaloceanspaces.com"
			region := "ams3"
			sess := session.Must(session.NewSession(&aws.Config{
				Endpoint:    &endpoint,
				Region:      &region,
				Credentials: credentials.NewStaticCredentials("DO00HXJJQVNBTGA62TV7", "4YPA8WqAOgWRgotafeArld4oVjOhhnra21zmFw07PGU", ""),
			}))

			// Create an uploader with the session and default options
			uploader := s3manager.NewUploader(sess)

			myBucket := "inscriptions-mvp"
			filename := rawTransaction.TxResponse.Txhash + ext[0]
			// Upload the file to S3.
			uploadResult, err := uploader.Upload(&s3manager.UploadInput{
				ACL:    aws.String("public-read"),
				Bucket: aws.String(myBucket),
				Key:    aws.String(filename),
				Body:   bytes.NewReader(contentBytes),
			})
			if err != nil {
				return fmt.Errorf("failed to upload file, %v", err)
			}
			fmt.Printf("file uploaded to, %s\n", aws.StringValue(&uploadResult.Location))

			height, _ := strconv.ParseUint(rawTransaction.TxResponse.Height, 10, 64)

			inscriptionModel := models.Inscription{
				Height:         height,
				Hash:           rawTransaction.TxResponse.Txhash,
				Creator:        sender,
				Owner:          sender,
				Parent:         string(parentJSON),
				Type:           extension.MsgTypeURL,
				MetadataBase64: extension.Granter,
				ContentBase64:  extension.Grantee,
				ContentPath:    aws.StringValue(&uploadResult.Location),
				DateCreated:    rawTransaction.TxResponse.Timestamp,
			}

			result := i.db.Save(&inscriptionModel)
			if result.Error != nil {
				return result.Error
			}

		case InscriptionTypeContentNFT:
			fmt.Println("NFT inscription")
		}

	}

	// TODO Handle the different type of inscriptions

	return nil
}
