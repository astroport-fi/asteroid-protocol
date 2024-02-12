package models

import "time"

type InscriptionTradeHistory struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	InscriptionID uint64    `gorm:"column:inscription_id"`
	SellerAddress string    `gorm:"column:seller_address"`
	BuyerAddress  string    `gorm:"column:buyer_address"`
	AmountQuote   uint64    `gorm:"column:amount_quote"` // Total ATOM
	TotalUSD      float64   `gorm:"column:total_usd"`    // Amount in USD
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (InscriptionTradeHistory) TableName() string {
	return "inscription_trade_history"
}
