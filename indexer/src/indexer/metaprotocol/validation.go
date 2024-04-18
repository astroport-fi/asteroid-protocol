package metaprotocol

import (
	"fmt"
	"strings"

	types "github.com/cosmos/cosmos-sdk/types"
)

func ValidateCosmosAddress(address string) error {
	if len(address) != 45 {
		return fmt.Errorf("cosmos hub addresses must be 45 characters long")
	}
	if !strings.Contains(address, "cosmos1") {
		return fmt.Errorf("destination address does not look like a valid address")
	}

	_, err := types.AccAddressFromBech32(address)
	return err
}
