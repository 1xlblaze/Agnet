# 05 — API Contract

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [04-database.md](04-database.md), [18-security.md](18-security.md)

---

## Conventions

- Base path: `/api/v1`
- JSON request/response
- Auth: GitHub OAuth session/JWT (M1+); health endpoints unauthenticated
- Errors: structured `{ "error": { "code", "message", "request_id" } }`
- IDs: UUID strings
- Idempotency: webhook handlers use `X-Hub-Signature-256` + `github_delivery_id`

---

## Health

```http
GET /health
GET /ready
```

- `/health` — process up
- `/ready` — dependencies reachable (Postgres, Redis)

---

## Projects

```http
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

**POST body (MVP):**

```json
{
  "name": "payments-api",
  "description": "Payment processing service",
  "organization_id": "uuid"
}
```

---

## Repositories

```http
GET  /api/v1/repositories
POST /api/v1/repositories
GET  /api/v1/repositories/:id
POST /api/v1/repositories/:id/analyze
```

**POST** registers a GitHub repo under a project (installation scoped).  
**POST …/analyze** enqueues baseline scan.

---

## Pull Requests

```http
GET  /api/v1/pull-requests
GET  /api/v1/pull-requests/:id
POST /api/v1/pull-requests/:id/analyze
```

Filters: `repository_id`, `status`. Analyze enqueues PR analysis job.

---

## Analysis

```http
GET  /api/v1/analyses/:id
POST /api/v1/analyses
```

Response includes status, timestamps, links to findings/risk when available.

---

## Risk

```http
GET /api/v1/risk-assessments/:id
```

Returns dimension scores, blast radius, overall risk, decision.

---

## Deployments

```http
GET  /api/v1/deployments
GET  /api/v1/deployments/:id
POST /api/v1/deployments/:id/rollback
```

Rollback creates a new deployment referencing `rollback_of` and emits audit events.

---

## Certificates

```http
GET /api/v1/certificates/:id
```

Immutable snapshot of evidence + decision for a deployment.

---

## Webhooks (M1)

```http
POST /api/v1/webhooks/github
```

Headers: `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256`.

Must be idempotent. See [06-github-integration.md](06-github-integration.md).

---

## API Service Responsibilities

Authentication, project management, repositories, PRs, analyses, findings, risk assessments, verification, deployments, certificates.

---

## Versioning

Breaking changes require `/api/v2` or negotiated compatibility. Update this doc when public interfaces change (Codex Rule 14).
