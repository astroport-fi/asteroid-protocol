package types

type InscriptionMigrationData struct {
	Header     []string   `json:"header"`
	Rows       [][]string `json:"rows"`
	Collection string     `json:"collection"`
}

type Trait struct {
	TraitType string `json:"trait_type"`
	Value     string `json:"value"`
}

type NftMetadata struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Mime        string  `json:"mime"`
	Attributes  []Trait `json:"attributes"`
	Filename    string  `json:"filename"`
	TokenID     uint64  `json:"token_id"`
}

type CollectionMetadata struct {
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	Mime              string  `json:"mime"`
	Symbol            string  `json:"symbol"`
	Minter            string  `json:"minter,omitempty"`
	RoyaltyPercentage float32 `json:"royalty_percentage,omitempty"`
	PaymentAddress    string  `json:"payment_address,omitempty"`
	Twitter           string  `json:"twitter,omitempty"`
	Telegram          string  `json:"telegram,omitempty"`
	Discord           string  `json:"discord,omitempty"`
	Website           string  `json:"website,omitempty"`
}

type InscriptionNftMetadata struct {
	Parent   InscriptionMetadataParent `json:"parent"`
	Metadata NftMetadata               `json:"metadata"`
}

func GetTraits(attributeNames []string, row []string) []Trait {
	traits := make([]Trait, 0)
	for i, attribute := range attributeNames {
		if attribute != "" && row[i] != "" {
			trait := Trait{
				TraitType: attribute,
				Value:     row[i],
			}
			traits = append(traits, trait)
		}
	}
	return traits
}
