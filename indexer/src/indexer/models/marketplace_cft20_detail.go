package models

import "time"

type MarketplaceCFT20Detail struct {
	ID          uint64    `gorm:"primary_key"`
	ListingID   uint64    `gorm:"column:listing_id"`
	TokenID     uint64    `gorm:"column:token_id"`
	Amount      uint64    `gorm:"column:amount"` // Amount of TokenID listed
	PPT         uint64    `gorm:"column:ppt"`    // PPT = Price Per Token, in uatom
	DateCreated time.Time `gorm:"column:date_created"`
}

func (MarketplaceCFT20Detail) TableName() string {
	return "marketplace_cft20_detail"
}
