package models

import "gorm.io/datatypes"

type LaunchpadMintReservation struct {
	ID           uint64         `gorm:"primary_key"`
	CollectionID uint64         `gorm:"column:collection_id"`
	LaunchpadID  uint64         `gorm:"column:launchpad_id"`
	StageID      uint64         `gorm:"column:stage_id"`
	Address      string         `gorm:"column:address"`
	TokenId      uint64         `gorm:"column:token_id"`
	IsMinted     bool           `gorm:"column:is_minted"`
	Metadata     datatypes.JSON `gorm:"column:metadata"`
	IsRandom     bool           `gorm:"column:is_random"`
}

func (LaunchpadMintReservation) TableName() string {
	return "launchpad_mint_reservation"
}
