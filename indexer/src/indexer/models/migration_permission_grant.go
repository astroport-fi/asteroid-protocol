package models

import "time"

type MigrationPermissionGrant struct {
	ID            uint64    `gorm:"primary_key"`
	InscriptionID uint64    `gorm:"column:inscription_id"`
	Granter       string    `gorm:"column:granter"`
	Grantee       string    `gorm:"column:grantee"`
	DateCreated   time.Time `gorm:"column:date_created"`
}

func (MigrationPermissionGrant) TableName() string {
	return "migration_permission_grant"
}
