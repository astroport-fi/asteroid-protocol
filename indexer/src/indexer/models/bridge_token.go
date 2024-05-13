package models

import "time"

type BridgeToken struct {
	ID            uint64    `gorm:"primary_key"`
	RemoteChainID uint64    `gorm:"column:remote_chain_id"`
	TokenID       uint64    `gorm:"column:token_id"`
	Enabled       bool      `gorm:"column:enabled"`
	DateCreated   time.Time `gorm:"column:date_created"`
	DateModified  time.Time `gorm:"column:date_modified"`
	Signature     string    `gorm:"column:signature"`
}

func (BridgeToken) TableName() string {
	return "bridge_token"
}
