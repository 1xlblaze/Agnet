# 01 — Product Requirements Document (PRD)

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [00-product-overview.md](00-product-overview.md), [23-roadmap.md](23-roadmap.md)

---

## Goal

Build a production-grade SaaS that verifies AI-generated software changes before allowing them to reach production.

---

## Success Criteria (MVP)

1. A connected GitHub repository can be baselined (languages, services, APIs, DBs, messaging, deps, Docker, CI, tests).
2. A PR triggers analysis that produces findings, blast radius, and risk scores.
3. Verification requirements are generated from findings and executed with stored evidence.
4. Policy engine decides `ALLOW` / `BLOCK` / `HUMAN_APPROVAL` using deterministic rules (not LLM authority).
5. Eligible changes can preview-deploy, smoke-test, and (when policy allows) produce a production certificate.
6. Failed post-deploy health can trigger auditable rollback.

---

## Personas & Jobs To Be Done

### Senior engineer
- Connect repo once; trust AgentGuard to gate AI agent PRs.
- See findings with evidence, not vague review comments.
- Auto-deploy only when confidence is high.

### Platform / DevOps
- Ephemeral preview environments with TTL.
- Clear deploy/rollback audit trail.

### Security
- Secrets never in sandboxes or logs.
- Independent scanners + policy, LLM advisory only.

---

## Functional Requirements

| ID | Requirement | Milestone |
|----|-------------|-----------|
| FR-01 | Monorepo with API, worker, analyzer, web, Compose, CI | M0 |
| FR-02 | Health/ready endpoints, config, structured logs, graceful shutdown | M0 |
| FR-03 | GitHub OAuth + GitHub App install | M1 |
| FR-04 | Idempotent webhooks (`pull_request`, `push`, `workflow_run`, `deployment_status`) | M1 |
| FR-05 | Repository clone + baseline analysis | M2 |
| FR-06 | Architecture / dependency graph | M3 |
| FR-07 | Blast radius scoring | M4 |
| FR-08 | Multi-dimension risk engine | M5 |
| FR-09 | Structured LLM findings (advisory) | M6 |
| FR-10 | Verification plans + evidence store | M7 |
| FR-11 | Coding agent fix loop (max 3 iterations) in sandbox | M8 |
| FR-12 | Preview deploy + smoke tests | M9 |
| FR-13 | Production policy, deploy, monitor, rollback | M10 |
| FR-14 | Project generator (repo + template + infra) | M11 |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Control plane / execution plane separation (mandatory) |
| NFR-02 | Least privilege, short-lived credentials, no prod secrets in sandboxes |
| NFR-03 | Idempotent webhooks and jobs |
| NFR-04 | Timeouts, exponential backoff, no infinite retries |
| NFR-05 | Structured JSON logging; never log secrets |
| NFR-06 | OpenTelemetry traces on requests and jobs |
| NFR-07 | Certificates immutable once issued |
| NFR-08 | LLM cannot authorize deploy, mutate infra, or access prod DB |

---

## Core Product Loop

```text
Developer → AI Agent → GitHub PR → AgentGuard
  → Analyze / Security / Architecture
  → Blast Radius → Risk → Verification Plan
  → Coding Agent (fix/tests) → Verification
  → Preview → Smoke → Policy → BLOCK | DEPLOY
  → Monitor → Healthy | Rollback
```

---

## Acceptance for “Production Ready” Change

All must be true:

```text
Risk <= threshold
AND Critical findings == 0
AND High findings == 0
AND Tests pass
AND Preview passes
AND Smoke tests pass
AND Policy allows
```

---

## Out of Scope (MVP)

Billing, enterprise SSO, multi-cloud, Slack/Jira, mobile, K8s-as-product, custom LLM training. See [78 in AGENTGUARD.md](../AGENTGUARD.md).

---

## Demo Milestone (post M0–M10)

Create Project → payments-api scaffolded → Codex adds payment retry → AgentGuard finds duplicate-payment risk → Codex fixes + tests → preview + smoke → certificate → AUTO DEPLOY → monitoring.
