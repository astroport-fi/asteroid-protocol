package workers

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/riverqueue/river"
	"gorm.io/gorm"
)

type CollectionStatsArgs struct {
	CollectionID uint64 `json:"collection_id"`
}

func (CollectionStatsArgs) Kind() string { return "collection-stats" }

func (CollectionStatsArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{
		UniqueOpts: river.UniqueOpts{
			ByArgs:   true,
			ByPeriod: DebouncePeriod,
		},
	}
}

type CollectionStatsWorker struct {
	DB *gorm.DB
	river.WorkerDefaults[CollectionStatsArgs]
}

// Executes the database query to insert or update stats a given collection id.
func (w *CollectionStatsWorker) Work(ctx context.Context, job *river.Job[CollectionStatsArgs]) error {
	query := `
	INSERT INTO collection_stats(id, listed, floor_price, floor_price_1d_change, floor_price_1w_change, owners, supply, volume, volume_24h, volume_7d)
		SELECT 
			@collectionId as "id", 
			COUNT(mid.id) as listed, 
			COALESCE(MIN(ml.total), 0) as floor_price,
			(SELECT change FROM collection_floor_daily WHERE collection_id = @collectionId and NOW()::date - "date" <= interval '24 hours' LIMIT 1) as floor_price_1d_change,
			(SELECT change FROM collection_floor_weekly WHERE collection_id = @collectionId and NOW()::date - "date" <= 7 LIMIT 1) as floor_price_1w_change,
			(SELECT COUNT(DISTINCT current_owner) as owners FROM inscription WHERE collection_id = @collectionId),
			(SELECT COUNT(id) as supply FROM inscription WHERE collection_id = @collectionId),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = @collectionId),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume_24h FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = @collectionId and NOW() - ith.date_created <= interval '24 HOURS'),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume_7d FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = @collectionId and NOW() - ith.date_created <= interval '7 DAYS')
		FROM marketplace_inscription_detail mid
		INNER JOIN marketplace_listing ml ON ml.id = mid.listing_id
		INNER JOIN inscription i ON i.id = mid.inscription_id
		WHERE ml.is_filled is false and ml.is_cancelled is false and i.collection_id = @collectionId
		ON CONFLICT (id) DO UPDATE SET listed = EXCLUDED.listed, supply = EXCLUDED.supply, owners = EXCLUDED.owners, volume = EXCLUDED.volume, volume_24h = EXCLUDED.volume_24h, volume_7d = EXCLUDED.volume_7d, floor_price = EXCLUDED.floor_price, floor_price_1w_change = EXCLUDED.floor_price_1w_change, floor_price_1d_change = EXCLUDED.floor_price_1d_change
	`

	err := w.DB.Exec(query, sql.Named("collectionId", job.Args.CollectionID)).Error
	if err != nil {
		return fmt.Errorf("failed to execute database query: %v", err)
	}

	return nil
}
