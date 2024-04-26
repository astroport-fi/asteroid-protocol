package models

type LaunchpadWhitelist struct {
	ID           uint64 `gorm:"primary_key"`
	CollectionID uint64 `gorm:"column:collection_id"`
	LaunchpadID  uint64 `gorm:"column:launchpad_id"`
	Address      string `gorm:"column:address"`
}

func (LaunchpadWhitelist) TableName() string {
	return "launchpad_whitelist"
}
