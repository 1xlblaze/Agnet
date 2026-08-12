# 02 — Architecture

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [13-sandbox.md](13-sandbox.md), [18-security.md](18-security.md), [20-infrastructure.md](20-infrastructure.md)

---

## High-Level Topology

```text
Frontend (Next.js)
    |
    v
API (Go/Gin)
    |
    +-------------------+
    |                   |
    v                   v
PostgreSQL            Redis
    |
    v
Worker
    |
    +------------+
    |            |
    v            v
Analyzer      Agent Runner
    |            |
    v            v
Repository     Sandbox
    |
    v
Architecture Graph
```

---

## Control Plane vs Execution Plane

**This separation is mandatory.**

### Control Plane
API, Database, Policy Engine, Dashboard, GitHub Integration, Risk Engine, Orchestrator.

### Execution Plane
Repository analysis, AI coding agents, tests, builds, preview deployments, security scanners.

The execution plane must **never** have unrestricted access to the control plane. Sandboxes receive only temporary, scoped credentials. See [13-sandbox.md](13-sandbox.md) and [18-security.md](18-security.md).

---

## Final Architecture

```text
                         AGENTGUARD
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
      CONTROL PLANE                         EXECUTION PLANE
          |                                       |
      Next.js                                  Sandbox
          |                                       |
         API                                  Analyzer
          |                                       |
     PostgreSQL                              Test Runner
          |                                       |
        Redis                                  Codex
          |                                       |
      Orchestrator                           Docker
          |                                       |
      Policy Engine                         Preview Env
          |                                       |
      GitHub App                            Deployment
          |                                       |
          +-------------------+-------------------+
                              |
                              v
                          Production
                              |
                              v
                         Monitoring
                              |
                    +---------+---------+
                    |                   |
                  Healthy             Failure
                    |                   |
                    v                   v
                   Done              Rollback
```

---

## Technology Choices

| Layer | Stack |
|-------|-------|
| Backend | Go, Gin, pgx, PostgreSQL, Redis, OpenTelemetry |
| Frontend | Next.js, TypeScript, Tailwind |
| AI | `LLMProvider` + `CodingAgent` interfaces |
| Deploy (customer apps) | GitHub Actions → Docker → ECR → ECS Fargate → ALB |

### AI abstractions

```go
type LLMProvider interface {
    Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error)
}

type CodingAgent interface {
    CreatePatch(ctx context.Context, request PatchRequest) (PatchResult, error)
}
```

LLM output is **advisory**. Policy engine has final authority. See [16-policy-engine.md](16-policy-engine.md).

---

## Repository Structure (target)

```text
agentguard/
apps/web/
services/api/
services/worker/
services/analyzer/
packages/shared/
infrastructure/terraform/
scripts/
docs/
.github/workflows/
docker-compose.yml
Makefile
.env.example
README.md
AGENTGUARD.md
```

---

## Service Responsibilities

| Service | Owns |
|---------|------|
| **api** | Auth, CRUD, webhooks ingress, job enqueue, policy decisions, certificates |
| **worker** | Orchestrates analysis, verification, agent loops, deploy jobs |
| **analyzer** | Repo/diff parsing, graph build, static findings inputs |
| **web** | Dashboard UX for projects, PRs, findings, deployments, certificates |

---

## Data Stores

| Store | Use |
|-------|-----|
| PostgreSQL | Source of truth for domain entities |
| Redis | Queues, locks, short-lived cache, idempotency helpers |

---

## Local Development Topology

Docker Compose runs PostgreSQL, Redis, API, Worker, Analyzer, Web.

```bash
make dev
make test
make lint
make build
```

---

## Design Invariants

1. Webhooks and jobs are idempotent.
2. No production credentials in execution plane.
3. No LLM-authorized deploys.
4. Certificates immutable.
5. Every autonomous run is sandboxed with limits + audit logs.
