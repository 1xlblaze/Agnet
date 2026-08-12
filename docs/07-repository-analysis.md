# 07 — Repository Analysis

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [08-architecture-graph.md](08-architecture-graph.md), Milestones M2–M3

---

## Interface

```go
type RepositoryAnalyzer interface {
    Analyze(ctx context.Context, request AnalyzeRequest) (*RepositoryGraph, error)
}
```

---

## Detection Targets

### Languages
Go, Python, JavaScript, TypeScript

### Frameworks
Gin, Echo, Fiber, FastAPI, Express, Next.js

### Databases
PostgreSQL, MySQL, Redis

### Messaging
Kafka, RabbitMQ, SQS

### Infrastructure
Docker, Terraform, GitHub Actions, Kubernetes (detect only; K8s product features are out of MVP scope)

---

## Change Intelligence (per changed file)

Compute:

```text
language
service
symbols
dependencies
APIs
database operations
messaging operations
external calls
```

---

## PR Analysis Pipeline

```text
GitHub → Webhook → API → Analysis Job → Worker → Fetch Diff → Analyze
```

Inputs: PR metadata + diff + repository baseline/graph.

Outputs: structured change map feeding blast radius, risk, and LLM advisory analysis.

---

## Execution Constraints

- Runs in execution plane / sandbox.
- Timeouts required.
- No control-plane credentials.
- Results persisted via worker → API/DB, not by writing back with elevated secrets.
