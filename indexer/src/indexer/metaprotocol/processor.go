package metaprotocol

import (
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/leodido/go-urn"
)

type Processor interface {
	Name() string
	Process(protocolURN *urn.URN, rawTransaction types.RawTransaction) ([]interface{}, error)
}
