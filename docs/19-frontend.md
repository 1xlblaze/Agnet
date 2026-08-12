# 19 — Frontend

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [05-api.md](05-api.md), Milestone M0 (scaffold) then feature pages with later milestones

---

## Stack

Next.js, TypeScript, Tailwind (`apps/web`).

---

## Pages

```text
/dashboard
/projects
/projects/:id
/repositories/:id
/pull-requests/:id
/analyses/:id
/deployments/:id
/certificates/:id
```

---

## Dashboard

Show production confidence and dimension scores, plus latest PR risk / blast radius / decision.

Example:

```text
Production Confidence 96 / 100
Security 98 · Reliability 94 · Performance 92 · Architecture 95 · Database 97

Latest PR #184 — Optimize payment processing
Risk 18 / 100 · Blast Radius 21 / 100 · Decision AUTO DEPLOY
```

---

## PR Detail

Display: PR, Agent, Commit, Files changed, Blast radius, Risk, Findings, Verification, Preview, Deployment, Certificate.

---

## Finding UI

Each finding shows: Severity, Category, File, Line, Description, Evidence, Recommendation, Confidence, Status.

Example:

```text
HIGH · Reliability · payment/service.go:84
Payment retry is not idempotent.
Evidence: Retry path can execute the database write twice.
Recommendation: Introduce an idempotency key.
Confidence: 94%
```

---

## UX Principles

- Evidence and decisions first — not generic “AI review” chat.
- Make BLOCK / HUMAN_APPROVAL reasons obvious.
- Certificates should feel like an audit artifact, not a marketing badge.
