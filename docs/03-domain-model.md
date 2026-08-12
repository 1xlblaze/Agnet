# 03 — Domain Model

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [04-database.md](04-database.md), [16-policy-engine.md](16-policy-engine.md)

---

## Core Entities

```text
organizations
users
projects
repositories
repository_scans
pull_requests
analyses
findings
risk_assessments
verification_runs
agent_runs
deployments
deployment_events
certificates
```

---

## Relationships (conceptual)

```text
Organization 1—* UserMembership
Organization 1—* Project
Project 1—* Repository
Repository 1—* PullRequest
Repository 1—* RepositoryScan
PullRequest 1—* Analysis
Analysis 1—* Finding
Analysis 1—1 RiskAssessment
Analysis 1—* VerificationRun
Analysis 1—* AgentRun
PullRequest 1—* Deployment
Deployment 1—1 Certificate (when issued)
Deployment 1—* DeploymentEvent
```

---

## Lifecycles

### Project

```text
CREATED → INITIALIZING → READY → DEPLOYING → RUNNING
                                         ↘ FAILED → ROLLING_BACK
```

### Analysis

```text
QUEUED → CLONING → ANALYZING → GRAPH_BUILDING → RISK_ANALYSIS → VERIFYING → COMPLETED
```

Terminal failure may set status to `FAILED` with `error`.

### AI Agent Run

```text
REQUESTED → RUNNING → PATCH_CREATED → TESTING → VERIFICATION → COMPLETED
                                                              ↘ FAILED
```

Max **3** fix iterations; then `HUMAN_APPROVAL_REQUIRED`.

### Deployment

```text
QUEUED → BUILDING → PREVIEWING → VERIFYING → APPROVED → DEPLOYING → HEALTH_CHECK → COMPLETED
                                                                         ↘ FAILED → ROLLBACK
```

---

## Key Domain Concepts

### Finding
A structured risk or defect discovered during analysis (static, LLM-advisory, compatibility, etc.). Drives verification requirements.

### Blast Radius
Numeric impact score (0–100) over services, APIs, DB, messaging, shared libs, critical paths. See [09-blast-radius.md](09-blast-radius.md).

### Risk Assessment
Weighted multi-dimension scores + overall risk + decision input for policy. Higher = riskier. See [10-risk-engine.md](10-risk-engine.md).

### Verification Evidence
Typed artifacts proving a requirement was satisfied (`TEST_RESULT`, `STATIC_SCAN`, …). See [11-verification-engine.md](11-verification-engine.md).

### Certificate
Immutable record binding commit, evidence, risk/blast radius, and decision at deploy time.

### Policy Decision
`ALLOW` | `BLOCK` | `HUMAN_APPROVAL` — deterministic, never LLM-owned.

---

## Status Enums (canonical strings)

Use uppercase snake or title forms consistently in DB; prefer:

| Entity | Values |
|--------|--------|
| Project | `CREATED`, `INITIALIZING`, `READY`, `DEPLOYING`, `RUNNING`, `FAILED`, `ROLLING_BACK` |
| Analysis | `QUEUED`, `CLONING`, `ANALYZING`, `GRAPH_BUILDING`, `RISK_ANALYSIS`, `VERIFYING`, `COMPLETED`, `FAILED` |
| AgentRun | `REQUESTED`, `RUNNING`, `PATCH_CREATED`, `TESTING`, `VERIFICATION`, `COMPLETED`, `FAILED` |
| Deployment | `QUEUED`, `BUILDING`, `PREVIEWING`, `VERIFYING`, `APPROVED`, `DEPLOYING`, `HEALTH_CHECK`, `COMPLETED`, `FAILED`, `ROLLBACK` |
| Finding severity | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (maps from 0–100 bands) |
| Policy | `ALLOW`, `BLOCK`, `HUMAN_APPROVAL` |
