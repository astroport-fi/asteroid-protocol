package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	worker "github.com/donovansolms/cosmos-inscriptions/indexer/src/worker"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	log "github.com/sirupsen/logrus"
)

// Config defines the environment variables for the service
type Config struct {
	LogFormat   string `envconfig:"LOG_FORMAT" required:"true"`
	LogLevel    string `envconfig:"LOG_LEVEL" required:"true"`
	ServiceName string `envconfig:"SERVICE_NAME" required:"true"`
}

func forever() {
	for {
		time.Sleep(time.Second)
	}
}

func main() {
	// Load ENV vars from .env
	err := godotenv.Load()
	if err != nil {
		log.Warn("Error loading .env file")
	}

	// Parse config environment variables
	var config Config
	err = envconfig.Process("", &config)
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
		"service": fmt.Sprintf("%s-worker", config.ServiceName),
	})
	logger.Info("Init worker")

	// create worker service
	ctx := context.Background()

	service, err := worker.NewWorker(ctx, logger)
	if err != nil {
		panic(err)
	}

	if err := service.Start(); err != nil {
		panic(err)
	}

	// Set up signal handler, ie ctrl+c
	quitChannel := make(chan os.Signal, 1)
	signal.Notify(quitChannel, syscall.SIGINT, syscall.SIGTERM)

	go forever()

	// cleanup
	sig := <-quitChannel
	logger.WithFields(log.Fields{
		"signal": sig,
	}).Info("Received OS signal")
	err = service.Stop()
	if err != nil {
		log.WithError(err).Error("Failed to stop service")
	}

	logger.Info("Shutdown")
}
