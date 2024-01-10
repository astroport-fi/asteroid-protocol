package models

import (
	"time"

	"gorm.io/datatypes"
)

type Token struct {
	ID                uint64         `gorm:"primary_key"`
	ChainID           string         `gorm:"column:chain_id"`
	Height            uint64         `gorm:"column:height"`
	Version           string         `gorm:"column:version"`
	TransactionID     uint64         `gorm:"column:transaction_id"`
	Creator           string         `gorm:"column:creator"`
	CurrentOwner      string         `gorm:"column:current_owner"`
	Name              string         `gorm:"column:name"`
	Ticker            string         `gorm:"column:ticker"`
	Decimals          uint64         `gorm:"column:decimals"`
	MaxSupply         uint64         `gorm:"column:max_supply"`
	PerMintLimit      uint64         `gorm:"column:per_mint_limit"`
	LaunchTimestamp   uint64         `gorm:"column:launch_timestamp"`
	MintPage          string         `gorm:"column:mint_page"`
	Metadata          datatypes.JSON `gorm:"column:metadata"`
	ContentPath       string         `gorm:"column:content_path"`
	ContentSizeBytes  uint64         `gorm:"column:content_size_bytes"`
	CirculatingSupply uint64         `gorm:"column:circulating_supply"`
	LastPriceBase     uint64         `gorm:"column:last_price_base"`
	Volume24Base      uint64         `gorm:"column:volume_24_base"`
	DateCreated       time.Time      `gorm:"column:date_created"`
}

func (Token) TableName() string {
	return "token"
}
