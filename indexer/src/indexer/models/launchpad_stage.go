package models

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
)

type PriceCurve string

const (
	Fixed  PriceCurve = "fixed"
	Linear PriceCurve = "linear"
)

func (p *PriceCurve) Scan(value interface{}) error {
	str, ok := value.(string)
	if !ok {
		return fmt.Errorf("invalid str")
	}
	*p = PriceCurve(str)

	return nil
}

func (p PriceCurve) Value() (driver.Value, error) {
	return string(p), nil
}

type LaunchpadStage struct {
	ID           uint64         `gorm:"primary_key"`
	CollectionID uint64         `gorm:"column:collection_id"`
	LaunchpadID  uint64         `gorm:"column:launchpad_id"`
	Name         sql.NullString `gorm:"column:name"`
	Description  sql.NullString `gorm:"column:description"`
	StartDate    sql.NullTime   `gorm:"column:start_date"`
	FinishDate   sql.NullTime   `gorm:"column:finish_date"`
	Price        uint64         `gorm:"column:price"`
	PriceCurve   PriceCurve     `gorm:"column:price_curve"`
	PerUserLimit int64          `gorm:"column:per_user_limit"`
	HasWhitelist bool           `gorm:"column:has_whitelist"`
}

func (LaunchpadStage) TableName() string {
	return "launchpad_stage"
}
