package metaprotocol

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
)

// QueryAddressBalance queries the balance of denom for address
func QueryAddressBalance(endpoints []string, headers map[string]string, address string, denom string, height uint64) uint64 {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/cosmos/bank/v1beta1/balances/%s/by_denom?denom=%s", randomEndpoint(endpoints), address, denom), nil)
	if err != nil {
		return 0
	}
	for key, value := range headers {
		req.Header.Add(key, value)
	}
	req.Header.Add("x-cosmos-block-height", strconv.FormatUint(height, 10))
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0
	}

	defer resp.Body.Close()

	var balanceResponse types.BalanceResponse
	err = json.NewDecoder(resp.Body).Decode(&balanceResponse)
	if err != nil {
		return 0
	}

	// Parse the amount
	amount, err := strconv.ParseUint(balanceResponse.Balance.Amount, 10, 64)
	if err != nil {
		return 0
	}
	return amount
}

// randomEndpoint returns a random LCD endpoint to use
// We do this to balance the load across multiple endpoints very naively
func randomEndpoint(endpoints []string) string {
	return endpoints[rand.Intn(len(endpoints))]
}
