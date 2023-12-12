package models

import "time"

type InscriptionPartial struct {
	ID            uint64    `gorm:"primary_key"`
	Height        uint64    `gorm:"column:height"`
	Hash          string    `gorm:"column:hash"`
	Type          string    `gorm:"column:type"`
	PartIndex     uint64    `gorm:"column:part_index"`
	PartsTotal    uint64    `gorm:"column:parts_total"`
	ContentBase64 string    `gorm:"column:content_base64"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (InscriptionPartial) TableName() string {
	return "inscription_partial"
}
