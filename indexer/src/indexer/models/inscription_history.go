package models

import "time"

type InscriptionHistory struct {
	ID            uint64    `gorm:"primary_key"`
	ChainID       string    `gorm:"column:chain_id"`
	Height        uint64    `gorm:"column:height"`
	TransactionID uint64    `gorm:"column:transaction_id"`
	InscriptionID uint64    `gorm:"column:inscription_id"`
	Sender        string    `gorm:"column:sender"`
	Receiver      string    `gorm:"column:receiver"`
	Action        string    `gorm:"column:action"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (InscriptionHistory) TableName() string {
	return "inscription_history"
}
