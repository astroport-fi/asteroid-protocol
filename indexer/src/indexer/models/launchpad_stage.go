package models

import (
	"database/sql"
)

type LaunchpadStage struct {
	ID           uint64         `gorm:"primary_key"`
	Name         sql.NullString `gorm:"column:name"`
	Description  sql.NullString `gorm:"column:description"`
	CollectionID uint64         `gorm:"column:collection_id"`
	LaunchpadID  uint64         `gorm:"column:launchpad_id"`
	StartDate    sql.NullTime   `gorm:"column:start_date"`
	FinishDate   sql.NullTime   `gorm:"column:finish_date"`
	Price        uint64         `gorm:"column:price"`
	PerUserLimit uint64         `gorm:"column:per_user_limit"`
}

func (LaunchpadStage) TableName() string {
	return "launchpad_stage"
}
