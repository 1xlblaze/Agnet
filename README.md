# AgentGuard

Production control plane for AI coding agents.

> **AgentGuard lets engineering teams give AI coding agents more autonomy without giving up production safety.**

## Start here

1. Read [`AGENTGUARD.md`](AGENTGUARD.md)
2. Browse [`docs/`](docs/)
3. Run locally (below)

## Architecture (implemented)

```text
Next.js (apps/web)
    ↓
API (services/api) ── PostgreSQL / Redis
    ↓
Worker (services/worker)
    ├── Analyzer graph / blast / risk
    ├── LLM advisory findings
    ├── Verification evidence
    ├── Codex fix loop (sandbox)
    ├── Preview + production policy
    └── Immutable certificates
```

## Quick start (native)

```bash
# deps: Go 1.22+, Node 22+, Postgres 16, Redis 7
cp .env.example .env
make migrate
make test
make lint
go build -o bin/api ./services/api/cmd/api
go build -o bin/worker ./services/worker/cmd/worker
go build -o bin/analyzer ./services/analyzer/cmd/analyzer

./bin/api &
./bin/worker &
HTTP_ADDR=:8082 ./bin/analyzer &

cd apps/web && npm install && npm run build && npm run start
```

End-to-end demo:

```bash
make e2e
```

This creates `payments-api`, opens PR #184 (payment retry), detects duplicate-payment risk, runs the Codex fix loop, verifies evidence, preview-deploys, and **AUTO DEPLOYs** when policy allows.

## Docker Compose

```bash
docker compose up --build
```

Compose files are included (`Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.analyzer`, `apps/web/Dockerfile`). On some restricted VMs overlayfs may block image builds; use the native path above.

## API

- `GET /health` `GET /ready`
- `/api/v1/projects` `/repositories` `/pull-requests` `/analyses` `/risk-assessments` `/deployments` `/certificates`
- `POST /api/v1/projects/generate`
- `POST /api/v1/webhooks/github` (signature + delivery idempotency)

## Docs

See [`docs/README.md`](docs/README.md).

## Status

Working local MVP covering M0–M11 flows with deterministic analyzers, advisory LLM, sandboxed agent stub, policy engine, preview/prod deploy simulation, and certificates. Real GitHub App OAuth, AWS ECS preview clusters, and live OpenAI/Codex providers are wired as interfaces/env and ready for production credentials.
