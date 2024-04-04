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
)

type ClientConfig struct {
	DatabaseDNS string `envconfig:"DATABASE_DNS" required:"true"`
}

type WorkerClient struct {
	client *river.Client[pgx.Tx]
	logger *logrus.Entry
	ctx    context.Context
}

func NewWorkerClient(logger *logrus.Entry) (*WorkerClient, error) {
	// Parse config environment variables for self
	var config Config
	err := envconfig.Process("", &config)
	if err != nil {
		logger.Fatalf("Unable to process config: %s", err)
	}

	// Setup database connection
	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, config.DatabaseDSN)
	if err != nil {
		return nil, err
	}

	// setup river client
	riverClient, err := river.NewClient(riverpgxv5.New(dbPool), &river.Config{})
	if err != nil {
		return nil, err
	}

	return &WorkerClient{
		client: riverClient,
		logger: logger,
		ctx:    ctx,
	}, nil
}

func (p *WorkerClient) UpdateCollectionStats(collectionId uint64) {
	_, err := p.client.Insert(p.ctx, workers.CollectionStatsArgs{
		CollectionID: collectionId,
	}, &river.InsertOpts{ScheduledAt: time.Now().Add(10 * time.Minute)})
	if err != nil {
		p.logger.Errorf("failed to insert collection stats job '%s'", err)
	}
}

func (p *WorkerClient) UpdateCollectionTraits(collectionId uint64) {
	_, err := p.client.Insert(p.ctx, workers.CollectionTraitsArgs{
		CollectionID: collectionId,
	}, nil)
	if err != nil {
		p.logger.Errorf("failed to insert collection traits job '%s'", err)
	}
}
