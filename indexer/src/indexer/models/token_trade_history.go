package models

import "time"

type TokenTradeHistory struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	TokenID       uint64    `gorm:"column:token_id"`
	SellerAddress string    `gorm:"column:seller_address"`
	BuyerAddress  string    `gorm:"column:buyer_address"`
	AmountQuote   uint64    `gorm:"column:amount_quote"` // Amount of TokenID
	AmountBase    uint64    `gorm:"column:amount_base"`  // Amount of ATOM
	Rate          uint64    `gorm:"column:rate"`         // Amount of ATOM per TokenID
	TotalUSD      float64   `gorm:"column:total_usd"`    // Amount of USD
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (TokenTradeHistory) TableName() string {
	return "token_trade_history"
}
