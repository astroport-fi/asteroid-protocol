package metaprotocol

import (
	"crypto/ed25519"
	"crypto/x509"
	b64 "encoding/base64"
	"fmt"
	"log"
	"strings"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type BridgeConfig struct {
	BridgePrivateKey string `envconfig:"BRIDGE_PRIVATE_KEY" required:"true"`
	BridgePublicKey  string `envconfig:"BRIDGE_PUBLIC_KEY" required:"true"`
}

type Bridge struct {
	chainID string
	db      *gorm.DB
	privKey ed25519.PrivateKey
	pubKey  ed25519.PublicKey
	cft20   *CFT20
}

func NewBridgeProcessor(chainID string, db *gorm.DB, cft20 *CFT20) *Bridge {
	// Parse config environment variables for self
	var config BridgeConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	privKeyDer, err := b64.StdEncoding.DecodeString(config.BridgePrivateKey)
	if err != nil {
		log.Fatalf("Unable to parse private key: %s", err)
	}
	pubKeyDer, err := b64.StdEncoding.DecodeString(config.BridgePublicKey)
	if err != nil {
		log.Fatalf("Unable to parse public key: %s", err)
	}

	privKey, err := x509.ParsePKCS8PrivateKey(privKeyDer)
	if err != nil {
		log.Fatalf("Unable to parse public key: %s", err)
	}

	pubKey, err := x509.ParsePKIXPublicKey(pubKeyDer)
	if err != nil {
		log.Fatalf("Unable to parse public key: %s", err)
	}

	return &Bridge{
		chainID: chainID,
		db:      db,
		privKey: privKey.(ed25519.PrivateKey),
		pubKey:  pubKey.(ed25519.PublicKey),
		cft20:   cft20,
	}
}

func (protocol *Bridge) Name() string {
	return "bridge"
}

func (protocol *Bridge) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return err
	}

	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return err
	}

	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("chain ID in protocol string does not match transaction chain ID")
	}
	switch parsedURN.Operation {
	case "send":
		// Parse data from URN
		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)
		amountString := strings.TrimSpace(parsedURN.KeyValuePairs["amt"])
		receiverAddress := strings.TrimSpace(parsedURN.KeyValuePairs["dst"])
		remoteChainId := strings.TrimSpace(parsedURN.KeyValuePairs["rch"])
		remoteContract := strings.TrimSpace(parsedURN.KeyValuePairs["rco"])

		// TODO: Check if receiver address is valid

		// Check if we know about the remote chain
		var remoteChainModel models.BridgeRemoteChain
		result := protocol.db.Where("chain_id = ? AND remote_chain_id = ?", parsedURN.ChainID, remoteChainId).First(&remoteChainModel)
		if result.Error != nil {
			return fmt.Errorf("remote chain '%s' doesn't exist", remoteChainId)
		}

		// Check that the remote contract matches what we expect
		// TODO: Do we actually need the remote contract address in the memo and signature or can we just get it from the DB?
		if remoteChainModel.RemoteContract != remoteContract {
			return fmt.Errorf("incorrect remote contract for chain '%s'", remoteChainId)
		}

		tokenModel, amount, err := protocol.cft20.ParseTokenData(ticker, amountString)
		if err != nil {
			return err
		}

		// Check if this token has been enabled for bridging
		var bridgeTokenModel models.BridgeToken
		result = protocol.db.Where("remote_chain_id = ? AND token_id = ?", remoteChainModel.ID, tokenModel.ID).First(&bridgeTokenModel)
		if result.Error != nil || !bridgeTokenModel.Enabled {
			return fmt.Errorf("token %s not enabled for bridging to %s", ticker, remoteChainId)
		}

		// Perform the transfer to the virtual bridge address (modifies state)
		err = protocol.cft20.Transfer(transactionModel, sender, "bridge", tokenModel, amount, "bridge", CFT20TransferOptions{ToVirtual: true})
		if err != nil {
			return err
		}

		// Note: A signature is spendable! Create and store it last.
		attestation := []byte(parsedURN.ChainID + transactionModel.Hash + tokenModel.Ticker + fmt.Sprintf("%d", amount) + remoteChainId + remoteContract + receiverAddress)
		signature := b64.StdEncoding.EncodeToString(ed25519.Sign(protocol.privKey, attestation))

		// Record the bridge operation
		bridgeHistory := models.BridgeHistory{
			ChainID:        parsedURN.ChainID,
			Height:         transactionModel.Height,
			TransactionID:  transactionModel.ID,
			TokenID:        tokenModel.ID,
			Sender:         sender,
			Action:         "send",
			Amount:         amount,
			RemoteChainID:  remoteChainId,
			RemoteContract: remoteContract,
			Receiver:       receiverAddress,
			Signature:      signature,
			DateCreated:    transactionModel.DateCreated,
		}
		result = protocol.db.Save(&bridgeHistory)
		if result.Error != nil {
			return result.Error
		}
	case "recv":
		// Parse data from URN
		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)
		amountString := strings.TrimSpace(parsedURN.KeyValuePairs["amt"])
		receiverAddress := strings.TrimSpace(parsedURN.KeyValuePairs["dst"])
		remoteChainId := strings.TrimSpace(parsedURN.KeyValuePairs["rch"])
		remoteSenderAddress := strings.TrimSpace(parsedURN.KeyValuePairs["src"])

		var remoteChainModel models.BridgeRemoteChain
		result := protocol.db.Where("chain_id = ? AND remote_chain_id = ?", protocol.chainID, remoteChainId).First(&remoteChainModel)
		if result.Error != nil {
			return fmt.Errorf("remote chain '%s' doesn't exist", remoteChainId)
		}

		// TODO: Check that the originating address matches remoteChainModel.RemoteContract
		// TODO: Check that the tx came through remoteChainModel.IBCChannel
		// TODO: Check if receiverAddress is valid
		// TODO: Check if remoteSenderAddress is valid

		tokenModel, amount, err := protocol.cft20.ParseTokenData(ticker, amountString)
		if err != nil {
			return err
		}

		// Check that token is enabled for bridging
		var bridgeTokenModel models.BridgeToken
		result = protocol.db.Where("remote_chain_id = ? AND token_id = ?", remoteChainModel.ID, tokenModel.ID).First(&bridgeTokenModel)
		if result.Error != nil || !bridgeTokenModel.Enabled {
			return fmt.Errorf("token %s not enabled for bridging to %s", ticker, remoteChainId)
		}

		// Perform the transfer from virtual bridge address (modifies state)
		err = protocol.cft20.Transfer(transactionModel, "bridge", receiverAddress, tokenModel, amount, "bridge", CFT20TransferOptions{FromVirtual: true})
		if err != nil {
			return err
		}

		// Record the bridge operation (no signature needed)
		bridgeHistory := models.BridgeHistory{
			ChainID:        parsedURN.ChainID,
			Height:         transactionModel.Height,
			TransactionID:  transactionModel.ID,
			TokenID:        tokenModel.ID,
			Sender:         remoteSenderAddress,
			Action:         "recv",
			Amount:         amount,
			RemoteChainID:  remoteChainId,
			RemoteContract: remoteChainModel.RemoteContract,
			Receiver:       receiverAddress,
			DateCreated:    transactionModel.DateCreated,
		}
		result = protocol.db.Save(&bridgeHistory)
		if result.Error != nil {
			return result.Error
		}
	case "enable":
		// Parse data from URN
		ticker := strings.TrimSpace(parsedURN.KeyValuePairs["tic"])
		ticker = strings.ToUpper(ticker)
		remoteChainId := strings.TrimSpace(parsedURN.KeyValuePairs["rch"])

		var remoteChainModel models.BridgeRemoteChain
		result := protocol.db.Where("chain_id = ? AND remote_chain_id = ?", protocol.chainID, remoteChainId).First(&remoteChainModel)
		if result.Error != nil {
			return fmt.Errorf("remote chain '%s' doesn't exist", remoteChainId)
		}

		// Check if the ticker exists
		var tokenModel models.Token
		result = protocol.db.Where("chain_id = ? AND ticker = ?", protocol.chainID, ticker).First(&tokenModel)
		if result.Error != nil {
			return fmt.Errorf("token with ticker '%s' doesn't exist", ticker)
		}

		// Create a signature for the enablement
		attestation := []byte(parsedURN.ChainID + tokenModel.Ticker + fmt.Sprintf("%d", tokenModel.Decimals) + remoteChainId + remoteChainModel.RemoteContract)
		signature := b64.StdEncoding.EncodeToString(ed25519.Sign(protocol.privKey, attestation))

		// Create a bridge token record
		bridgeTokenModel := models.BridgeToken{
			RemoteChainID: remoteChainModel.ID,
			TokenID:       tokenModel.ID,
			Enabled:       true,
			Signature:     signature,
		}

		result = protocol.db.Save(&bridgeTokenModel)
		if result.Error != nil {
			return result.Error
		}
	}

	return nil
}
