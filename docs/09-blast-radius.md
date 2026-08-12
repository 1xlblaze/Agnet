# 09 — Blast Radius

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [08-architecture-graph.md](08-architecture-graph.md), [10-risk-engine.md](10-risk-engine.md), Milestone M4

---

## Definition

Blast radius measures the **potential impact** of a change — how widely effects could propagate if the change is wrong.

Score range: **0–100** (higher = larger impact).

---

## Factors

```text
number of services
number of APIs
database changes
messaging changes
external dependencies
shared libraries
critical paths
```

---

## Example Output

```text
BLAST RADIUS

21 / 100

Affected services: 2
Affected APIs: 3
Affected database tables: 2
Affected Kafka topics: 1
Downstream services: 4
```

---

## Computation Sketch

1. Map changed files/symbols → graph nodes.
2. Traverse outbound edges (CALLS, WRITES, PUBLISHES, DEPENDS_ON, …) within configured depth.
3. Weight critical path and production-facing APIs higher.
4. Normalize to 0–100 with configurable weights.

Weights must be configurable (org/project policy later; defaults in MVP).

---

## Policy Interaction

Deployment policy may set `max_blast_radius` (example: 50). Exceeding threshold → `BLOCK` or `HUMAN_APPROVAL`. See [16-policy-engine.md](16-policy-engine.md).
