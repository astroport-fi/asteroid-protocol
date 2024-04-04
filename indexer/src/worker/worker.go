package worker

import (
	"context"
	"time"

	workers "github.com/donovansolms/cosmos-inscriptions/indexer/src/worker/workers"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kelseyhightower/envconfig"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Config struct {
	DatabaseDSN string `envconfig:"DATABASE_DSN" required:"true"`
}

type Worker struct {
	ctx    context.Context
	dbPool *pgxpool.Pool
	client *river.Client[pgx.Tx]
}

func NewWorker(ctx context.Context, log *logrus.Entry) (*Worker, error) {
	// Parse config environment variables for self
	var config Config
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	// Setup database connection
	dbPool, err := pgxpool.New(ctx, config.DatabaseDSN)
	if err != nil {
		return nil, err
	}

	// Setup GORM
	db, err := gorm.Open(postgres.Open(config.DatabaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	// Setup workers
	w := river.NewWorkers()
	river.AddWorker(w, &workers.CollectionStatsWorker{DB: db})
	river.AddWorker(w, &workers.CollectionTraitsWorker{DB: db})
	river.AddWorker(w, &workers.CollectionsStatsWorker{DB: db})

	// Setup periodic jobs
	periodicJobs := []*river.PeriodicJob{
		river.NewPeriodicJob(
			river.PeriodicInterval(4*time.Hour),
			func() (river.JobArgs, *river.InsertOpts) {
				return workers.CollectionsStatsArgs{}, nil
			},
			&river.PeriodicJobOpts{RunOnStart: true},
		),
	}

	riverClient, err := river.NewClient(riverpgxv5.New(dbPool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 5},
		},
		PeriodicJobs: periodicJobs,
		Workers:      w,
	})
	if err != nil {
		panic(err)
	}

	return &Worker{
		ctx:    ctx,
		dbPool: dbPool,
		client: riverClient,
	}, nil
}

func (w *Worker) Start() error {
	return w.client.Start(w.ctx)
}

func (w *Worker) Stop() error {
	err := w.client.StopAndCancel(w.ctx)
	w.dbPool.Close()
	return err
}
