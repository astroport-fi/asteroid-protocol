package main

import (
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/donovansolms/cosmos-inscriptions/indexer/src/indexer"
	"github.com/kelseyhightower/envconfig"
	log "github.com/sirupsen/logrus"
)

// Config defines the environment variables for the service
// TODO: Move this content to a config file
type Config struct {
	LogFormat                string `envconfig:"LOG_FORMAT" required:"true"`
	LogLevel                 string `envconfig:"LOG_LEVEL" required:"true"`
	ServiceName              string `envconfig:"SERVICE_NAME" required:"true"`
	ChainID                  string `envconfig:"CHAIN_ID" required:"true"`
	DatabaseDSN              string `envconfig:"DATABASE_DSN" required:"true"`
	LCDEndpoint              string `envconfig:"LCD_ENDPOINT" required:"true"`
	BlockPollIntervalSeconds int    `envconfig:"BLOCK_POLL_INTERVAL_SECONDS" required:"true"`
	S3Endpoint               string `envconfig:"S3_ENDPOINT" required:"true"`
	S3Region                 string `envconfig:"S3_REGION" required:"true"`
	S3Bucket                 string `envconfig:"S3_BUCKET"`
	S3ID                     string `envconfig:"S3_ID" required:"true"`
	S3Secret                 string `envconfig:"S3_SECRET" required:"true"`
	S3Token                  string `envconfig:"S3_TOKEN"`
}

func main() {
	// Parse config vai environment variables
	var config Config
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Unable to process config: %s", err)
	}

	// Set up structured logging
	log.SetOutput(os.Stdout)
	log.SetFormatter(&log.JSONFormatter{
		TimestampFormat: "Jan 02 15:04:05",
	})
	if strings.ToLower(config.LogFormat) == "text" {
		log.SetFormatter(&log.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "Jan 02 15:04:05",
		})
	}
	logLevel, err := log.ParseLevel(config.LogLevel)
	if err != nil {
		log.Fatalf("Unable to parse log level: %s", err)
	}
	log.SetLevel(logLevel)
	logger := log.WithFields(log.Fields{
		"service": strings.ToLower(config.ServiceName),
	})

	// Set up signal handler, ie ctrl+c
	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, syscall.SIGINT, syscall.SIGTERM)

	// Construct the service
	logger.Info("Init service")

	// Set up collector
	service, err := indexer.New(
		config.ChainID,
		config.DatabaseDSN,
		config.LCDEndpoint,
		config.BlockPollIntervalSeconds,
		config.S3Endpoint,
		config.S3Region,
		config.S3Bucket,
		config.S3ID,
		config.S3Secret,
		config.S3Token,
		logger,
	)
	if err != nil {
		logger.Fatal(err)
	}

	// Handle stop signals
	go func() {
		sig := <-signalChannel
		logger.WithFields(log.Fields{
			"signal": sig,
		}).Info("Received OS signal")
		service.Stop()
	}()

	// Run forever
	err = service.Run()
	if err != nil {
		logger.Fatal(err)
	}

	logger.Info("Shutdown")
}
