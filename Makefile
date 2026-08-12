.PHONY: dev test lint build run-api run-worker run-analyzer migrate e2e docker-up docker-down tidy

export DATABASE_URL ?= postgres://agentguard:agentguard@127.0.0.1:5432/agentguard?sslmode=disable
export REDIS_URL ?= redis://127.0.0.1:6379/0

tidy:
	go mod tidy

migrate:
	psql "$(DATABASE_URL)" -f migrations/001_init.sql

test:
	go test ./...

lint:
	go vet ./...

build:
	mkdir -p bin
	go build -o bin/api ./services/api/cmd/api
	go build -o bin/worker ./services/worker/cmd/worker
	go build -o bin/analyzer ./services/analyzer/cmd/analyzer
	cd apps/web && npm install && npm run build

run-api:
	go run ./services/api/cmd/api

run-worker:
	go run ./services/worker/cmd/worker

run-analyzer:
	HTTP_ADDR=:8082 go run ./services/analyzer/cmd/analyzer

dev:
	-docker compose up -d postgres redis
	$(MAKE) migrate

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down -v

e2e:
	bash scripts/e2e.sh
