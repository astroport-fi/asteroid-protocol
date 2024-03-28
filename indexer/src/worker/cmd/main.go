package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	worker "github.com/donovansolms/cosmos-inscriptions/indexer/src/worker"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
)

func forever() {
	for {
		time.Sleep(time.Second)
	}
}

func main() {
	// load ENV vars from .env
	err := godotenv.Load()
	if err != nil {
		log.Warn("Error loading .env file")
	}

	ctx := context.Background()

	service, err := worker.NewWorker(ctx)
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
	log.WithFields(log.Fields{
		"signal": sig,
	}).Info("Received OS signal")
	err = service.Stop()
	if err != nil {
		log.WithError(err).Error("Failed to stop service")
	}
}
