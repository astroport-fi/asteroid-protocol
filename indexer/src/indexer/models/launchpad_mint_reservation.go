package models

type LaunchpadMintReservation struct {
	ID           uint64 `gorm:"primary_key"`
	CollectionID uint64 `gorm:"column:collection_id"`
	LaunchpadID  uint64 `gorm:"column:launchpad_id"`
	StageID      uint64 `gorm:"column:stage_id"`
	Address      string `gorm:"column:address"`
	TokenId      uint64 `gorm:"column:token_id"`
	IsMinted     bool   `gorm:"column:is_minted"`
}

func (LaunchpadMintReservation) TableName() string {
	return "launchpad_mint_reservation"
}
