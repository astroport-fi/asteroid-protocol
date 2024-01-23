package models

import "time"

type MarketplaceListing struct {
	ID                    uint64    `gorm:"primary_key"`
	ChainID               string    `gorm:"column:chain_id"`
	TransactionID         uint64    `gorm:"column:transaction_id"`
	SellerAddress         string    `gorm:"column:seller_address"`
	Total                 uint64    `gorm:"column:total"`
	DepositTotal          uint64    `gorm:"column:deposit_total"`
	DepositTimeout        uint64    `gorm:"column:deposit_timeout"`
	DepositorAddress      string    `gorm:"column:depositor_address"`
	DepositorTimeoutBlock uint64    `gorm:"column:depositor_timedout_block"`
	IsDeposited           bool      `gorm:"column:is_deposited"`
	IsFilled              bool      `gorm:"column:is_filled"`
	IsCancelled           bool      `gorm:"column:is_cancelled"`
	DateUpdated           time.Time `gorm:"column:date_updated"`
	DateCreated           time.Time `gorm:"column:date_created"`
}

func (MarketplaceListing) TableName() string {
	return "marketplace_listing"
}
