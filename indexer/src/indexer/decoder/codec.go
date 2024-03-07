package decoder

import (
	"github.com/cosmos/cosmos-sdk/codec/types"
)

type TxExtensionOptionI interface{}

func RegisterInterfaces(registry types.InterfaceRegistry) {
	registry.RegisterInterface("cosmos.tx.v1beta1.TxExtensionOptionI", (*TxExtensionOptionI)(nil))

	registry.RegisterImplementations(
		(*TxExtensionOptionI)(nil),
		&ExtensionData{},
	)

}
