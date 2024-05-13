package models

import "time"

type BridgeRemoteChain struct {
	ID             uint64    `gorm:"primary_key"`
	ChainID        string    `gorm:"column:chain_id"`
	RemoteChainID  string    `gorm:"column:remote_chain_id"`
	RemoteContract string    `gorm:"column:remote_contract"`
	IBCChannel     string    `gorm:"column:ibc_channel"`
	DateCreated    time.Time `gorm:"column:date_created"`
	DateModified   time.Time `gorm:"column:date_modified"`
}

func (BridgeRemoteChain) TableName() string {
	return "bridge_remote_chain"
}
