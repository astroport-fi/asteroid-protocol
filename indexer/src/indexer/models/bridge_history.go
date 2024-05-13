package models

import "time"

type BridgeHistory struct {
	ID             uint64    `gorm:"primary_key"`
	ChainID        string    `gorm:"column:chain_id"`
	Height         uint64    `gorm:"column:height"`
	TransactionID  uint64    `gorm:"column:transaction_id"`
	TokenID        uint64    `gorm:"column:token_id"`
	Sender         string    `gorm:"column:sender"`
	Action         string    `gorm:"column:action"`
	Amount         uint64    `gorm:"column:amount"`
	RemoteChainID  string    `gorm:"column:remote_chain_id"`
	RemoteContract string    `gorm:"column:remote_contract"`
	Receiver       string    `gorm:"column:receiver"`
	Signature      string    `gorm:"column:signature"`
	DateCreated    time.Time `gorm:"column:date_created"`
}

func (BridgeHistory) TableName() string {
	return "bridge_history"
}
