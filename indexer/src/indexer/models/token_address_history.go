package models

import "time"

type TokenAddressHistory struct {
	ID              uint64    `gorm:"primary_key"`
	ChainID         string    `gorm:"column:chain_id"`
	Height          uint64    `gorm:"column:height"`
	TransactionHash string    `gorm:"column:transaction_hash"`
	Ticker          string    `gorm:"column:ticker"`
	Sender          string    `gorm:"column:sender"`
	Action          string    `gorm:"column:action"`
	Amount          uint64    `gorm:"column:amount"`
	DateCreated     time.Time `gorm:"column:date_created"`
}

func (TokenAddressHistory) TableName() string {
	return "token_address_history"
}
