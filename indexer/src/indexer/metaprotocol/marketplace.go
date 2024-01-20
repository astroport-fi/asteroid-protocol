package metaprotocol

import (
	"fmt"
	"log"
	"os"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/models"
	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/kelseyhightower/envconfig"
	"github.com/leodido/go-urn"
	"gorm.io/gorm"
)

type MarketplaceConfig struct {
}

type Marketplace struct {
	chainID string
	version string
	db      *gorm.DB
}

func NewMarketplaceProcessor(chainID string, db *gorm.DB) *Marketplace {
	// Parse config environment variables for self
	var config InscriptionConfig
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	return &Marketplace{
		chainID: chainID,
		version: "v1",
		db:      db,
	}
}

func (protocol *Marketplace) Name() string {
	return "marketplace"
}

func (protocol *Marketplace) Process(transactionModel models.Transaction, protocolURN *urn.URN, rawTransaction types.RawTransaction) error {
	sender, err := rawTransaction.GetSenderAddress()
	if err != nil {
		return err
	}

	// We need to parse the protocol specific string in SS, it contains
	// {chainId}@{version};operation$h={unique hash of content}
	// cosmoshub-4@v1beta;deploy$nam=The Name,tic=TICK,sup=21000000,dec=6,lim=1000
	// cosmoshub-4@v1beta;deploy$nam=NewYearDay,tic=NYD,sup=28000000,dec=18,lim=50000,opn=1704059940
	parsedURN, err := ParseProtocolString(protocolURN)
	if err != nil {
		return err
	}

	if parsedURN.ChainID != protocol.chainID {
		return fmt.Errorf("chain ID in protocol string does not match transaction chain ID")
	}

	if parsedURN.Version != protocol.version {
		return fmt.Errorf("version in protocol string does not match transaction version")
	}

	// TODO: Rework the operation handling
	switch parsedURN.Operation {
	case "list.cft20":
		fmt.Println("LIST CFT", sender)
		os.Exit(0)
	case "list.inscription":
		fmt.Println("LIST inscription")
	case "deposit":
		fmt.Println("DEPOSIT")
	case "delist":
		fmt.Println("DELIST")
	case "buy":
		fmt.Println("BUY")
	}

	return nil
}
