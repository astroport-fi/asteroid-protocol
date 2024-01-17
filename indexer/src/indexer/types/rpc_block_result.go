package types

type TxResult struct {
	Code      int    `json:"code"`
	Data      string `json:"data"`
	Log       string `json:"log"`
	Info      string `json:"info"`
	GasWanted string `json:"gas_wanted"`
	GasUsed   string `json:"gas_used"`
	Events    []struct {
		Type       string `json:"type"`
		Attributes []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
			Index bool   `json:"index"`
		} `json:"attributes"`
	} `json:"events"`
	Codespace string `json:"codespace"`
}

type RPCBlockResult struct {
	Jsonrpc string `json:"jsonrpc"`
	ID      int    `json:"id"`
	Result  struct {
		Height           string     `json:"height"`
		TxsResults       []TxResult `json:"txs_results"`
		BeginBlockEvents []struct {
			Type       string `json:"type"`
			Attributes []struct {
				Key   string `json:"key"`
				Value string `json:"value"`
				Index bool   `json:"index"`
			} `json:"attributes"`
		} `json:"begin_block_events"`
		EndBlockEvents        any `json:"end_block_events"`
		ValidatorUpdates      any `json:"validator_updates"`
		ConsensusParamUpdates struct {
			Block struct {
				MaxBytes string `json:"max_bytes"`
				MaxGas   string `json:"max_gas"`
			} `json:"block"`
			Evidence struct {
				MaxAgeNumBlocks string `json:"max_age_num_blocks"`
				MaxAgeDuration  string `json:"max_age_duration"`
				MaxBytes        string `json:"max_bytes"`
			} `json:"evidence"`
			Validator struct {
				PubKeyTypes []string `json:"pub_key_types"`
			} `json:"validator"`
		} `json:"consensus_param_updates"`
	} `json:"result"`
}
