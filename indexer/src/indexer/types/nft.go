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
}

type InscriptionNftMetadata struct {
	Parent   InscriptionMetadataParent `json:"parent"`
	Metadata NftMetadata               `json:"metadata"`
}

func GetTraits(attributeNames []string, row []string) []Trait {
	traits := make([]Trait, 0)
	for i, attribute := range attributeNames {
		trait := Trait{
			TraitType: attribute,
			Value:     row[i],
		}
		traits = append(traits, trait)
	}
	return traits
}
