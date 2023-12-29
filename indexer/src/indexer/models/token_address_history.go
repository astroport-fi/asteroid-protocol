package models

import "time"

type TokenAddressHistory struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	Height        uint64    `gorm:"column:height"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	TokenID       uint64    `gorm:"column:token_id"`
	Sender        string    `gorm:"column:sender"`
	Receiver      string    `gorm:"column:receiver"`
	Action        string    `gorm:"column:action"`
	Amount        uint64    `gorm:"column:amount"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (TokenAddressHistory) TableName() string {
	return "token_address_history"
}
