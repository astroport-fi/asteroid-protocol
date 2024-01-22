package models

import "time"

type MarketplaceListingHistory struct {
	ID            uint64    `gorm:"primary_key"`
	ListingID     uint64    `gorm:"column:listing_id"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	SenderAddress string    `gorm:"column:sender_address"`
	Action        string    `gorm:"column:action"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (MarketplaceListingHistory) TableName() string {
	return "marketplace_listing_history"
}
