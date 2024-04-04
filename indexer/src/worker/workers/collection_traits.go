package workers

import (
	"context"
	"fmt"
	"time"

	"github.com/riverqueue/river"
	"gorm.io/gorm"
)

type CollectionTraitsArgs struct {
	CollectionID uint64 `json:"collection_id"`
}

func (CollectionTraitsArgs) Kind() string { return "collection-traits" }

func (CollectionTraitsArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{
		UniqueOpts: river.UniqueOpts{
			ByArgs:   true,
			ByPeriod: 10 * time.Minute,
		},
	}
}

type CollectionTraitsWorker struct {
	DB *gorm.DB
	river.WorkerDefaults[CollectionTraitsArgs]
}

// Executes the database query to insert or update collection traits and inscription rarity for a given collection id.
func (w *CollectionTraitsWorker) Work(ctx context.Context, job *river.Job[CollectionTraitsArgs]) error {
	collectionQuery := `
		INSERT INTO collection_traits (collection_id, trait_type, trait_value, count, rarity_score)
		SELECT collection_id, trait_type, trait_value, count, rarity_score FROM collection_traits_view ctv
		WHERE ctv.collection_id = ?
		ON CONFLICT (collection_id, trait_type, trait_value) DO UPDATE SET rarity_score = EXCLUDED.rarity_score, count = EXCLUDED.count
	`

	err := w.DB.Exec(collectionQuery, job.Args.CollectionID).Error
	if err != nil {
		return fmt.Errorf("failed to execute database query: %v", err)
	}

	query := `
		INSERT INTO inscription_rarity (id, rarity_score)
		SELECT i.id, ir.rarity_score
		FROM inscription i
		INNER JOIN inscription_rarity_view ir ON i.id = ir.id
		WHERE i.collection_id = ?
		ON CONFLICT (id) DO UPDATE SET rarity_score = EXCLUDED.rarity_score
	`

	err = w.DB.Exec(query, job.Args.CollectionID).Error
	if err != nil {
		return fmt.Errorf("failed to execute database query: %v", err)
	}

	return nil
}
