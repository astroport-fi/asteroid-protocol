package models

import (
	"time"
)

type Launchpad struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	Height        uint64    `gorm:"column:height"`
	Version       string    `gorm:"column:version"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	CollectionID  uint64    `gorm:"column:collection_id"`
	MaxSupply     uint64    `gorm:"column:max_supply"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (Launchpad) TableName() string {
	return "launchpad"
}
