# 04 — Database Schema

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [03-domain-model.md](03-domain-model.md), [05-api.md](05-api.md)

---

## Engine

PostgreSQL (primary). Redis is for queues/cache, not durable domain state.

Use UUIDs for primary keys unless noted. Timestamps are `timestamptz`.

---

## Tables

### organizations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | required |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| github_user_id | bigint | unique |
| email | text | |
| name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### projects

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| organization_id | uuid FK | → organizations |
| name | text | |
| description | text | |
| status | text | lifecycle |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### repositories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK | → projects |
| github_repository_id | bigint | unique per install |
| owner | text | |
| name | text | |
| default_branch | text | |
| installation_id | bigint | GitHub App installation |
| status | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### repository_scans

Baseline / graph snapshots for a repository (M2–M3). Store graph payload as JSONB.

| Suggested columns | Notes |
|-------------------|-------|
| id, repository_id, status, baseline jsonb, graph jsonb, commit_sha, started_at, completed_at, error, created_at | |

### pull_requests

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| repository_id | uuid FK | |
| github_pr_number | int | unique per repository |
| base_sha | text | |
| head_sha | text | |
| title | text | |
| author | text | |
| status | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### analyses

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| pull_request_id | uuid FK | |
| status | text | lifecycle |
| started_at | timestamptz | |
| completed_at | timestamptz | nullable |
| error | text | nullable |
| created_at | timestamptz | |

### findings

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| analysis_id | uuid FK | |
| severity | text | |
| category | text | |
| title | text | |
| description | text | |
| file | text | nullable |
| line | int | nullable |
| evidence | jsonb | |
| recommendation | text | |
| confidence | numeric | 0–1 |
| status | text | open/resolved/… |
| created_at | timestamptz | |

### risk_assessments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| analysis_id | uuid FK | unique |
| security_score | int | 0–100 |
| reliability_score | int | |
| performance_score | int | |
| database_score | int | |
| api_score | int | |
| messaging_score | int | |
| testing_score | int | |
| deployment_score | int | |
| blast_radius | int | 0–100 |
| overall_risk | int | weighted |
| decision | text | policy input / result |
| created_at | timestamptz | |

### verification_runs

| Suggested columns | Notes |
|-------------------|-------|
| id, analysis_id, requirements jsonb, evidence jsonb, status, started_at, completed_at, created_at | |

### agent_runs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| analysis_id | uuid FK | |
| provider | text | e.g. `codex` |
| task | text | |
| status | text | |
| iteration | int | ≤ 3 |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| input_tokens | int | |
| output_tokens | int | |
| error | text | |

### deployments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK | |
| pull_request_id | uuid FK | nullable for non-PR |
| environment | text | `preview` / `production` |
| version | text | |
| status | text | |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| rollback_of | uuid FK | → deployments, nullable |

### deployment_events

Audit stream for deploy/health/rollback.

| Suggested columns | Notes |
|-------------------|-------|
| id, deployment_id, event_type, payload jsonb, created_at | |

### certificates

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| deployment_id | uuid FK | |
| risk_score | int | |
| blast_radius | int | |
| evidence | jsonb | |
| decision | text | |
| commit_sha | text | |
| created_at | timestamptz | |

**Certificates are immutable** — no updates except possibly tombstone metadata outside MVP.

### webhook_deliveries (recommended for M1)

| Column | Notes |
|--------|-------|
| github_delivery_id PK/unique | Reject duplicates |
| event_type, payload jsonb, processed_at | Idempotency |

---

## Indexing Guidance

- Unique `(repository_id, github_pr_number)`
- Unique `github_delivery_id`
- Index `analyses(pull_request_id)`, `findings(analysis_id)`, `deployments(project_id)`
- GIN on JSONB evidence/graph columns when queried

---

## Migrations

Use versioned SQL migrations under `services/api` (or shared). Never edit applied migrations; add new ones.
