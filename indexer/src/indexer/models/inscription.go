package models

import (
	"database/sql"
	"time"

	"gorm.io/datatypes"
)

type Inscription struct {
	ID                uint64         `gorm:"primary_key"`
	InscriptionNumber uint64         `gorm:"column:inscription_number"`
	ChainID           string         `gorm:"column:chain_id"`
	Height            uint64         `gorm:"column:height"`
	Version           string         `gorm:"column:version"`
	TransactionID     uint64         `gorm:"column:transaction_id"`
	CollectionID      sql.NullInt64  `gorm:"column:collection_id"`
	ContentHash       string         `gorm:"column:content_hash"`
	Creator           string         `gorm:"column:creator"`
	CurrentOwner      string         `gorm:"column:current_owner"`
	Type              string         `gorm:"column:type"`
	Metadata          datatypes.JSON `gorm:"column:metadata"`
	ContentPath       string         `gorm:"column:content_path"`
	ContentSizeBytes  uint64         `gorm:"column:content_size_bytes"`
	DateCreated       time.Time      `gorm:"column:date_created"`
}

func (Inscription) TableName() string {
	return "inscription"
}
