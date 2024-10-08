package models

import (
	"time"
)

type TrollPost struct {
	ID               uint64    `gorm:"primary_key"`
	ChainID          string    `gorm:"column:chain_id"`
	Height           uint64    `gorm:"column:height"`
	Version          string    `gorm:"column:version"`
	TransactionID    uint64    `gorm:"column:transaction_id"`
	ContentHash      string    `gorm:"column:content_hash"`
	Creator          string    `gorm:"column:creator"`
	Text             string    `gorm:"column:text"`
	ContentPath      string    `gorm:"column:content_path"`
	ContentSizeBytes uint64    `gorm:"column:content_size_bytes"`
	DateCreated      time.Time `gorm:"column:date_created"`
}

func (TrollPost) TableName() string {
	return "troll_post"
}
