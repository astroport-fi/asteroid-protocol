package workers

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/riverqueue/river"
	"gorm.io/gorm"
)

type CollectionStatsArgs struct {
	CollectionID int64 `json:"collection_id"`
}

func (CollectionStatsArgs) Kind() string { return "collection-stats" }

type CollectionStatsWorker struct {
	DB *gorm.DB
	river.WorkerDefaults[CollectionStatsArgs]
}

// Executes the database query to insert or update stats a given collection id.
func (w *CollectionStatsWorker) Work(ctx context.Context, job *river.Job[CollectionStatsArgs]) error {
	query := `
	INSERT INTO collection_stats
		SELECT 
			@collectionId as "id", 
			COUNT(mid.id) as listed, 
			MIN(ml.total) as floor_price,
			(SELECT COUNT(DISTINCT current_owner) as owners FROM inscription WHERE collection_id = @collectionId),
			(SELECT COUNT(id) as supply FROM inscription WHERE collection_id = @collectionId),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume FROM inscription_trade_history ith INNER JOIN inscription i ON i.id = ith.inscription_id WHERE collection_id = @collectionId)
		FROM marketplace_inscription_detail mid
		INNER JOIN marketplace_listing ml ON ml.id = mid.listing_id
		INNER JOIN inscription i ON i.id = mid.inscription_id
		WHERE ml.is_filled is false and ml.is_cancelled is false and i.collection_id = @collectionId
	ON CONFLICT (id) DO UPDATE SET listed = EXCLUDED.listed, supply = EXCLUDED.supply, owners = EXCLUDED.owners, volume = EXCLUDED.volume, floor_price = EXCLUDED.floor_price
	`

	err := w.DB.Exec(query, sql.Named("collectionId", job.Args.CollectionID)).Error
	if err != nil {
		return fmt.Errorf("failed to execute database query: %v", err)
	}

	return nil
}
