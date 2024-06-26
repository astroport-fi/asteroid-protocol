package metaprotocol

import (
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/leodido/go-urn"
)

type Processor interface {
	Name() string
	Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction, sourceChannel string) error
}
