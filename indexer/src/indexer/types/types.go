package types

import (
	"encoding/json"
	"errors"
	"strings"
	"time"
	// "github.com/calvinlauyh/cosmosutils"
)

const InscriptionTypeContentGeneric = "inscriptions.v1.content.generic"
const InscriptionTypeContentNFT = "inscriptions.v1.content.nft"
const InscriptionTypeContentNFTCollection = "inscriptions.v1.content.nft.collection"
const InscriptionTypeMultipart = "inscriptions.v1.multipart"

const TransactionStatePending = "pending"
const TransactionStateSuccess = "success"
const TransactionStateError = "error: "

type InscriptionParent struct {
	Type       string `json:"@type"`
	Identifier string `json:"identifier"`
}

type MultipartMetadata struct {
	Index uint `json:"index"`
	Total uint `json:"total"`
}

type ContentGenericMetadata struct {
	Parent    InscriptionParent `json:"parent"`
	Multipart InscriptionParent `json:"part,omitempty"`
	Metadata  struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		MIME        string `json:"mime"`
	} `json:"metadata"`
}

type Tx struct {
	Hash     string
	RawTx    string
	ParsedTx string
	// CosmosTx cosmosutils.CosmosTx
}

type RPCStatus struct {
	Jsonrpc string `json:"jsonrpc"`
	ID      int    `json:"id"`
	Result  struct {
		NodeInfo struct {
			ProtocolVersion struct {
				P2P   string `json:"p2p"`
				Block string `json:"block"`
				App   string `json:"app"`
			} `json:"protocol_version"`
			ID         string `json:"id"`
			ListenAddr string `json:"listen_addr"`
			Network    string `json:"network"`
			Version    string `json:"version"`
			Channels   string `json:"channels"`
			Moniker    string `json:"moniker"`
			Other      struct {
				TxIndex    string `json:"tx_index"`
				RPCAddress string `json:"rpc_address"`
			} `json:"other"`
		} `json:"node_info"`
		SyncInfo struct {
			LatestBlockHash     string    `json:"latest_block_hash"`
			LatestAppHash       string    `json:"latest_app_hash"`
			LatestBlockHeight   string    `json:"latest_block_height"`
			LatestBlockTime     time.Time `json:"latest_block_time"`
			EarliestBlockHash   string    `json:"earliest_block_hash"`
			EarliestAppHash     string    `json:"earliest_app_hash"`
			EarliestBlockHeight string    `json:"earliest_block_height"`
			EarliestBlockTime   time.Time `json:"earliest_block_time"`
			CatchingUp          bool      `json:"catching_up"`
		} `json:"sync_info"`
		ValidatorInfo struct {
			Address string `json:"address"`
			PubKey  struct {
				Type  string `json:"type"`
				Value string `json:"value"`
			} `json:"pub_key"`
			VotingPower string `json:"voting_power"`
		} `json:"validator_info"`
	} `json:"result"`
}

type RPCBlock struct {
	Jsonrpc string `json:"jsonrpc"`
	ID      int    `json:"id"`
	Result  struct {
		BlockID struct {
			Hash  string `json:"hash"`
			Parts struct {
				Total int    `json:"total"`
				Hash  string `json:"hash"`
			} `json:"parts"`
		} `json:"block_id"`
		Block struct {
			Header struct {
				Version struct {
					Block string `json:"block"`
				} `json:"version"`
				ChainID     string    `json:"chain_id"`
				Height      string    `json:"height"`
				Time        time.Time `json:"time"`
				LastBlockID struct {
					Hash  string `json:"hash"`
					Parts struct {
						Total int    `json:"total"`
						Hash  string `json:"hash"`
					} `json:"parts"`
				} `json:"last_block_id"`
				LastCommitHash     string `json:"last_commit_hash"`
				DataHash           string `json:"data_hash"`
				ValidatorsHash     string `json:"validators_hash"`
				NextValidatorsHash string `json:"next_validators_hash"`
				ConsensusHash      string `json:"consensus_hash"`
				AppHash            string `json:"app_hash"`
				LastResultsHash    string `json:"last_results_hash"`
				EvidenceHash       string `json:"evidence_hash"`
				ProposerAddress    string `json:"proposer_address"`
			} `json:"header"`
			Data struct {
				Txs []string `json:"txs"`
			} `json:"data"`
			Evidence struct {
				Evidence []any `json:"evidence"`
			} `json:"evidence"`
			LastCommit struct {
				Height  string `json:"height"`
				Round   int    `json:"round"`
				BlockID struct {
					Hash  string `json:"hash"`
					Parts struct {
						Total int    `json:"total"`
						Hash  string `json:"hash"`
					} `json:"parts"`
				} `json:"block_id"`
				Signatures []struct {
					BlockIDFlag      int       `json:"block_id_flag"`
					ValidatorAddress string    `json:"validator_address"`
					Timestamp        time.Time `json:"timestamp"`
					Signature        string    `json:"signature"`
				} `json:"signatures"`
			} `json:"last_commit"`
		} `json:"block"`
	} `json:"result"`
}

type RawTransaction struct {
	Hash string `json:"hash"`
	Body struct {
		Messages []struct {
			Type        string `json:"@type"`
			FromAddress string `json:"from_address"`
			ToAddress   string `json:"to_address"`
			Amount      []struct {
				Denom  string `json:"denom"`
				Amount string `json:"amount"`
			} `json:"amount"`
			Receiver      string `json:"receiver"`
			Sender        string `json:"sender"`
			SourceChannel string `json:"source_channel"`
			Token         struct {
				Amount string `json:"amount"`
				Denom  string `json:"denom"`
			} `json:"token"`
		} `json:"messages"`
		Memo                        string `json:"memo"`
		TimeoutHeight               string `json:"timeout_height"`
		ExtensionOptions            []any  `json:"extension_options"`
		NonCriticalExtensionOptions []struct {
			Type       string `json:"@type"`
			Granter    string `json:"granter"`
			Grantee    string `json:"grantee"`
			MsgTypeURL string `json:"msg_type_url"`
		} `json:"non_critical_extension_options"`
	} `json:"body"`
	AuthInfo struct {
		SignerInfos []struct {
			PublicKey struct {
				Type string `json:"@type"`
				Key  string `json:"key"`
			} `json:"public_key"`
			ModeInfo struct {
				Single struct {
					Mode string `json:"mode"`
				} `json:"single"`
			} `json:"mode_info"`
			Sequence string `json:"sequence"`
		} `json:"signer_infos"`
		Fee struct {
			Amount []struct {
				Denom  string `json:"denom"`
				Amount string `json:"amount"`
			} `json:"amount"`
			GasLimit string `json:"gas_limit"`
			Payer    string `json:"payer"`
			Granter  string `json:"granter"`
		} `json:"fee"`
	} `json:"auth_info"`
	Signatures []string `json:"signatures"`
}

type RawInscription struct {
	Type       string `json:"@type"`
	Granter    string `json:"granter"`
	Grantee    string `json:"grantee"`
	MsgTypeURL string `json:"msg_type_url"`
}

func (tx RawTransaction) ToJSON() string {
	jsonBytes, _ := json.Marshal(tx)
	return string(jsonBytes)
}

func (tx RawTransaction) GetTxByteSize() int {
	jsonBytes, _ := json.Marshal(tx)
	return len(jsonBytes)
}

func (tx RawTransaction) GetSenderAddress() (string, error) {
	for _, message := range tx.Body.Messages {
		if message.FromAddress != "" {
			return message.FromAddress, nil
		}
		if message.Sender != "" {
			return message.Sender, nil
		}
	}
	return "", errors.New("no sender address found")
}

// ValidateBasic checks if the transaction contains a MsgSend as part of
// messages a memo that contains "urn:"
func (tx RawTransaction) ValidateBasic() error {

	// Verify that the transaction succeeded
	// if tx.TxResponse.Code != 0 {
	// 	return fmt.Errorf("transaction failed: %s", tx.TxResponse.RawLog)
	// }

	hasSend := false
	for _, v := range tx.Body.Messages {
		// TODO: This might need to be a IBC send
		if v.Type == "/cosmos.bank.v1beta1.MsgSend" {
			hasSend = true
			// TODO: In future we can ensure that the send amount if above
			// a certain minimum
			break
		}
	}

	hasInscriptionMemo := false
	if strings.Contains(strings.ToLower(tx.Body.Memo), "urn:") {
		hasInscriptionMemo = true
	}

	if hasSend && hasInscriptionMemo {
		return nil
	}

	return errors.New("transaction does not contain a valid metaprotocol memo")
}
