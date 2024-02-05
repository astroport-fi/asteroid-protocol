package models

import (
	"database/sql"
	"time"

	"gorm.io/datatypes"
)

type Collection struct {
	ID               uint64         `gorm:"primary_key"`
	ChainID          string         `gorm:"column:chain_id"`
	Height           uint64         `gorm:"column:height"`
	Version          string         `gorm:"column:version"`
	TransactionID    uint64         `gorm:"column:transaction_id"`
	ContentHash      string         `gorm:"column:content_hash"`
	Creator          string         `gorm:"column:creator"`
	Minter           sql.NullString `gorm:"column:minter"`
	Name             string         `gorm:"column:name"`
	Symbol           string         `gorm:"column:symbol"`
	Metadata         datatypes.JSON `gorm:"column:metadata"`
	ContentPath      string         `gorm:"column:content_path"`
	ContentSizeBytes uint64         `gorm:"column:content_size_bytes"`
	DateCreated      time.Time      `gorm:"column:date_created"`
}

func (Collection) TableName() string {
	return "collection"
}
