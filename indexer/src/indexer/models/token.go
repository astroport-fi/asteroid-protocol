package models

import "time"

type Token struct {
	ID      uint64 `gorm:"primary_key"`
	Height  uint64 `gorm:"column:height"`
	Hash    string `gorm:"column:hash"`
	Creator string `gorm:"column:creator"`
	Parent  string `gorm:"column:parent"`
	Owner   string `gorm:"column:owner"`

	Type           string    `gorm:"column:type"`
	MetadataBase64 string    `gorm:"column:metadata_base64"`
	ContentBase64  string    `gorm:"column:content_base64"`
	ContentPath    string    `gorm:"column:content_path"`
	DateCreated    time.Time `gorm:"column:date_created"`
}

func (Inscription) Token() string {
	return "token"
}
