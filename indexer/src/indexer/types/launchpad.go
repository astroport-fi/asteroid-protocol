package types

import "time"

type MintStage struct {
	Name        string    `json:"name,omitempty"`
	Description string    `json:"description,omitempty"`
	Start       time.Time `json:"start,omitempty"`
	Finish      time.Time `json:"finish,omitempty"`
	Price       uint64    `json:"price,omitempty"`
	Whitelist   []string  `json:"whitelist,omitempty"`
	MaxPerUser  uint64    `json:"maxPerUser,omitempty"`
}

type LaunchMetadata struct {
	Supply uint64      `json:"supply"`
	Stages []MintStage `json:"stages"`
}
