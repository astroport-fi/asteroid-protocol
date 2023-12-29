package models

import "time"

type TokenHolder struct {
	ID          uint64    `gorm:"primary_key"`
	ChainID     string    `gorm:"column:chain_id"`
	Ticker      string    `gorm:"column:ticker"`
	Address     string    `gorm:"column:address"`
	Amount      uint64    `gorm:"column:amount"`
	DateUpdated time.Time `gorm:"column:date_updated"`
}

func (TokenHolder) TableName() string {
	return "token_holder"
}
