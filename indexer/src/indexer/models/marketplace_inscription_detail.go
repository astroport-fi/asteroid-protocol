package models

import "time"

type MarketplaceInscriptionDetail struct {
	ID            uint64    `gorm:"primary_key"`
	ListingID     uint64    `gorm:"column:listing_id"`
	InscriptionID uint64    `gorm:"column:inscription_id"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (MarketplaceInscriptionDetail) TableName() string {
	return "marketplace_inscription_detail"
}
