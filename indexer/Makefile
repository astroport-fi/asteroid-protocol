#
# A Makefile to build, run and test Go code
#

.PHONY: default build fmt lint run run_race test clean vet docker_build docker_run docker_clean .start_redis

GIT_COMMIT := $(shell git rev-list -1 HEAD)
BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD)
IMAGE_NAME := "inscription-indexer:latest"
# This makes the APP_NAME be the name of the current directory
# Ex. in path /home/dev/app/my-app the APP_NAME will be set to my-app
APP_NAME := $(notdir $(CURDIR))
SERVICE_NAME := "inscription-indexer"

default: build ## Default: Build the binary for the service

dependencies: ## Install dependencies for the service
	go mod tidy

build: ## Build the binary for the service
	CGO_ENABLED=0 go build -o ./bin/${APP_NAME} ./src/*.go

build-worker: ## Build the binary for the service
	CGO_ENABLED=0 go build -o ./bin/worker src/worker/cmd/main.go


run: build ## Build and run the service binary
	./bin/${APP_NAME}

run-worker: build-worker ## Build and run the service binary
	./bin/worker

run_race: ## Run the service with race condition checking enabled
	# Add your environment variable here
	LOG_LEVEL=debug \
	LOG_FORMAT=text \
	SERVICE_NAME=${SERVICE_NAME} \
	go run -race ./src/*.go

docker_build: build ## Build the service Docker container
	docker build -t ${IMAGE_NAME} .

docker_run: ## Run the Docker container in interactive mode
	docker run -it --rm --network="host" \
		# Add your environment variable here
		-e LOG_LEVEL=debug \
		-e LOG_FORMAT=text \
		-e SERVICE_NAME=${SERVICE_NAME} \
		${IMAGE_NAME}

docker_push: ## Push the Docker container to the registry
	docker push ${IMAGE_NAME}

fmt: ## Format the code using `go fmt`
	go fmt ./...

test: ## Run the tests
	go test ./... -v

test_cover: ## Run tests with a coverage report
	go test ./... -v -cover -covermode=count -coverprofile=./coverage.out

test_cover_view: test_cover ## Run tests with coverage report and open HTML view
	go tool cover -html=coverage.out

clean: ## Remove compiled binaries from bin/
	rm ./bin/*

create-migration:
	atlas migrate diff --env gorm --to file://schema.sql

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
