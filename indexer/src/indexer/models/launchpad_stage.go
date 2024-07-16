package models

import (
	"database/sql"
)

type LaunchpadStage struct {
	ID           uint64         `gorm:"primary_key"`
	CollectionID uint64         `gorm:"column:collection_id"`
	LaunchpadID  uint64         `gorm:"column:launchpad_id"`
	Name         sql.NullString `gorm:"column:name"`
	Description  sql.NullString `gorm:"column:description"`
	StartDate    sql.NullTime   `gorm:"column:start_date"`
	FinishDate   sql.NullTime   `gorm:"column:finish_date"`
	Price        uint64         `gorm:"column:price"`
	PerUserLimit uint64         `gorm:"column:per_user_limit"`
}

func (LaunchpadStage) TableName() string {
	return "launchpad_stage"
}
