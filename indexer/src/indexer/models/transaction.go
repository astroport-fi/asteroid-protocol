package models

import "time"

type Transaction struct {
	ID            uint64    `gorm:"primary_key"`
	Height        uint64    `gorm:"column:height"`
	Hash          string    `gorm:"column:hash"`
	Content       string    `gorm:"column:content"`
	GasUsed       uint64    `gorm:"column:gas_used"`
	Fees          string    `gorm:"column:fees"`
	ContentLength uint64    `gorm:"column:content_length"`
	DateCreated   time.Time `gorm:"column:date_created"`
	StatusMessage string    `gorm:"column:status_message"`
}

func (Transaction) TableName() string {
	return "transaction"
}
