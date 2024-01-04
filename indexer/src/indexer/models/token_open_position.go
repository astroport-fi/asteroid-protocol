package models

import "time"

type TokenOpenPosition struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	TokenID       uint64    `gorm:"column:token_id"`
	SellerAddress string    `gorm:"column:seller_address"`
	Amount        uint64    `gorm:"column:amount"` // Amount of TokenID listed
	PPT           uint64    `gorm:"column:ppt"`    // PPT = Price Per Token, in uatom
	Total         uint64    `gorm:"column:total"`  // Amount * PPT
	DateCreated   time.Time `gorm:"column:date_created"`
	IsFilled      bool      `gorm:"column:is_filled"`
	IsCancelled   bool      `gorm:"column:is_cancelled"`
}

func (TokenOpenPosition) TableName() string {
	return "token_open_position"
}
