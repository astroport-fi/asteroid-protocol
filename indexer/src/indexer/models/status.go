package models

type Status struct {
	ID                  uint64  `gorm:"primary_key"`
	ChainID             string  `gorm:"column:chain_id"`
	LastProcessedHeight uint64  `gorm:"column:last_processed_height"`
	BaseToken           string  `gorm:"column:base_token"`
	BaseTokenUSD        float64 `gorm:"column:base_token_usd"`
}

func (Status) TableName() string {
	return "status"
}
