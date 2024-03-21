package metaprotocol

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer/types"
	"github.com/stretchr/testify/assert"
)

func loadTestData(filename string, v any) error {
	metadataBytes, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("error reading file: %v", err)
	}
	err = json.Unmarshal(metadataBytes, v)
	if err != nil {
		return fmt.Errorf("error unmarshalling: %v", err)
	}
	return nil
}

func TestMetadataMigration(t *testing.T) {
	// load metadata
	var metadata types.InscriptionNftMetadata
	err := loadTestData("testdata/metadata.json", &metadata)
	if err != nil {
		t.Fatalf("error loading metadata: %v", err)
	}

	// load migration data
	var migrationData types.InscriptionMigrationData
	err = loadTestData("testdata/migration1.json", &migrationData)
	if err != nil {
		t.Fatalf("error loading migration data: %v", err)
	}

	// load expected data
	var expectedData types.InscriptionNftMetadata
	err = loadTestData("testdata/expected1.json", &expectedData)
	if err != nil {
		t.Fatalf("error loading expected data: %v", err)
	}

	// migrate inscriptions
	attributeNames := migrationData.Header[1:]
	for _, row := range migrationData.Rows {
		traits := types.GetTraits(attributeNames, row[1:])
		metadata.Metadata.Attributes = traits
		assert.Equal(t, expectedData, metadata, "they should be equal")
	}
}

func TestMetadataMigrationWithoutCollection(t *testing.T) {
	// load migration data
	var migrationData types.InscriptionMigrationData
	err := loadTestData("testdata/migration2.json", &migrationData)
	if err != nil {
		t.Fatalf("error loading migration data: %v", err)
	}

	assert.Empty(t, migrationData.Collection, "collection should be empty")
}

func TestReservations(t *testing.T) {
	reservationsByName, _ := GetReservations("../../../data/collection-reservations.csv")
	assert.NotEmpty(t, reservationsByName, "reservationsByName should not be empty")
}
