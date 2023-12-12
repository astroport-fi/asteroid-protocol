package models

import "time"

type Inscription struct {
	ID             uint64    `gorm:"primary_key"  json:"id"`
	Height         uint64    `gorm:"column:height" json:"height"`
	Hash           string    `gorm:"column:hash" json:"hash"`
	Creator        string    `gorm:"column:creator" json:"creator"`
	Parent         string    `gorm:"column:parent" json:"parent"`
	Owner          string    `gorm:"column:owner" json:"owner"`
	Type           string    `gorm:"column:type" json:"type"`
	MetadataBase64 string    `gorm:"column:metadata_base64" json:"metadata_base64"`
	ContentBase64  string    `gorm:"column:content_base64" json:"content_base64"`
	ContentPath    string    `gorm:"column:content_path" json:"content_path"`
	DateCreated    time.Time `gorm:"column:date_created" json:"date_created"`
}

func (Inscription) TableName() string {
	return "inscription"
}
