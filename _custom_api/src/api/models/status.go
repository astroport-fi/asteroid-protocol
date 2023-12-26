package models

type Status struct {
	ID                  uint64 `gorm:"primary_key"`
	ChainID             string `gorm:"column:chain_id"`
	LastProcessedHeight uint64 `gorm:"column:last_processed_height"`
}

func (Status) TableName() string {
	return "status"
}
