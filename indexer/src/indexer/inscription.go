package indexer

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
)

func (i *Indexer) processInscription(rawTransaction RawTransaction) error {
	i.logger.Debug("Processing Inscription:", rawTransaction.TxResponse.Txhash)

	// TODO: Check for a duplicate of the content
	// rawTransaction.Tx.Body.NonCriticalExtensionOptions

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

			var genericMetadata ContentGenericMetadata
			err = json.Unmarshal(metadataBytes, &genericMetadata)
			if err != nil {
				return err
			}

			fmt.Println(genericMetadata.Parent.Type)
			fmt.Println(genericMetadata.Parent.Identifier)
			fmt.Println(genericMetadata.Metadata.Name)

		case InscriptionTypeContentNFT:
			fmt.Println("NFT inscription")
		}

	}

	// TODO Handle the different type of inscriptions

	return nil
}
