package decoder

import (
	"github.com/cosmos/cosmos-sdk/codec"
	cosmostypes "github.com/cosmos/cosmos-sdk/types"
	authtx "github.com/cosmos/cosmos-sdk/x/auth/tx"
)

type Tx struct {
	cosmostypes.Tx
	codec codec.ProtoCodecMarshaler
}

func (tx *Tx) MarshalToJSON() ([]byte, error) {
	return authtx.DefaultJSONTxEncoder(tx.codec)(tx.Tx)
}

type CosmosTx struct {
	Body       Body     `json:"body"`
	AuthInfo   AuthInfo `json:"auth_info"`
	Signatures []string `json:"signatures"`
}

type Body struct {
	Messages                    []map[string]interface{} `json:"messages"`
	Memo                        string                   `json:"memo"`
	TimeoutHeight               string                   `json:"timeout_height"`
	ExtensionOptions            []interface{}            `json:"extension_options"`
	NonCriticalExtensionOptions []interface{}            `json:"non_critical_extension_options"`
}

type Message struct {
	Type string `json:"@type"`
}

type AuthInfo struct {
	SignerInfos []SignerInfo `json:"signer_infos"`
	Fee         Fee          `json:"fee"`
}

type Fee struct {
	Amount   []Amount `json:"amount"`
	GasLimit string   `json:"gas_limit"`
	Payer    string   `json:"payer"`
	Granter  string   `json:"granter"`
}

type Amount struct {
	Denom  string `json:"denom"`
	Amount string `json:"amount"`
}

type SignerInfo struct {
	PublicKey SignerInfoPublicKey `json:"public_key"`
	ModeInfo  ModeInfo            `json:"mode_info"`
	Sequence  string              `json:"sequence"`
}

type SignerInfoPublicKey struct {
	Type            string      `json:"@type"`
	MaybeThreshold  *int64      `json:"threshold,omitempty"`
	MaybePublicKeys []PublicKey `json:"public_keys,omitempty"`
	MaybeKey        *string     `json:"key,omitempty"`
}

type PublicKey struct {
	Type string `json:"@type"`
	Key  string `json:"key"`
}

type ModeInfo struct {
	MaybeSingle *Single `json:"single,omitempty"`
	MaybeMulti  *Multi  `json:"multi,omitempty"`
}

type Single struct {
	Mode string `json:"mode"`
}

type Multi struct {
	Bitarray  Bitarray         `json:"bitarray"`
	ModeInfos []SingleModeInfo `json:"mode_infos"`
}

type SingleModeInfo struct {
	Single Single `json:"single"`
}

type Bitarray struct {
	ExtraBitsStored int64  `json:"extra_bits_stored"`
	Elems           string `json:"elems"`
}
