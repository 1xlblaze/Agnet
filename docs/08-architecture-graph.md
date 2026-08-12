# 08 — Architecture Graph

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [07-repository-analysis.md](07-repository-analysis.md), [09-blast-radius.md](09-blast-radius.md), Milestone M3

---

## Node Types

```text
Service
API
Database
Table
Topic
Cache
ExternalService
Dependency
Configuration
```

---

## Relationship Types

```text
CALLS
READS
WRITES
PUBLISHES
CONSUMES
DEPENDS_ON
EXPOSES
```

---

## Example

```text
payment-service
 |
 +-- POST /payments
 |
 +-- PostgreSQL
 |      |
 |      +-- payments
 |
 +-- Redis
 |
 +-- Kafka
        |
        +-- payment-events
              |
              +-- settlement-service
```

---

## Persistence

Store serialized graph (JSONB) on `repository_scans` / analysis artifacts. Version with `commit_sha`.

---

## Uses

1. Baseline understanding of the system
2. Mapping PR symbol/file changes onto services and edges
3. Blast radius traversal (downstream consumers, shared DBs/topics)
4. Context for LLM advisory analysis (structured graph, not raw repo dump alone)

---

## Invariants

- Graph build must be deterministic for the same commit when possible.
- Prefer static evidence over hallucinated edges; mark low-confidence edges explicitly if inferred.
