# 23 — Roadmap

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [24-codex-development-rules.md](24-codex-development-rules.md)

---

## Milestone Protocol

Implement **one milestone at a time**. Do not auto-continue. After each milestone: tests, lint, build, docs update, stop for review.

---

## M0 — Foundation

```text
Go · Next.js · Postgres · Redis · Docker · CI
```

API `/health` + `/ready`, structured logging, config, graceful shutdown, basic tests, Compose up, README.

**Do not implement:** GitHub OAuth/App, analysis, graph, blast radius, risk, LLM, Codex, deploy, Terraform, billing.

See M0 prompt in [`AGENTGUARD.md` §82](../AGENTGUARD.md).

---

## M1 — GitHub

OAuth, GitHub App, repositories, webhooks, PR events (idempotent).

---

## M2 — Analyzer

Repository, diff, language, dependencies, APIs, DB, messaging.

---

## M3 — Graph

Architecture graph, dependency graph.

---

## M4 — Blast Radius

Impact calculation.

---

## M5 — Risk

Security, reliability, performance, database, API, messaging (+ related dimensions).

---

## M6 — AI

LLM analysis with structured findings (advisory only).

---

## M7 — Verification

Tests, security evidence, evidence store.

---

## M8 — Codex

Agent, sandbox, fix loop (max 3).

---

## M9 — Preview

ECR, ECS, preview, smoke tests.

---

## M10 — Production

Policy, deploy, monitor, rollback.

---

## M11 — Project Generator

GitHub repo, template, infrastructure, deployment.

---

## Explicitly Not Initial

Kubernetes product, mobile, 20 languages, enterprise SSO, multi-cloud, complex billing, marketplace, Slack/Jira, advanced analytics, custom LLM training.

---

## First Major Demo (after M0–M10)

Create Project → scaffold payments-api → Codex adds payment retry → AgentGuard finds duplicate payment risk → Codex fixes + tests → preview + smoke → certificate → AUTO DEPLOY → monitoring.
