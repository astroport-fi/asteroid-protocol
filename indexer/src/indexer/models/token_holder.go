package models

import "time"

type TokenHolder struct {
	ID          uint64    `gorm:"primary_key"`
	Height      uint64    `gorm:"column:height"`
	TokenID     string    `gorm:"column:token_id"`
	Owner       string    `gorm:"column:owner"`
	Amount      uint64    `gorm:"column:amount"`
	DateCreated time.Time `gorm:"column:date_created"`
}

func (Inscription) TokenHolder() string {
	return "token_holder"
}
