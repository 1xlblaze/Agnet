# 00 — Product Overview

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [01-prd.md](01-prd.md), [23-roadmap.md](23-roadmap.md)

---

## One Sentence

> **AgentGuard lets engineering teams give AI coding agents more autonomy without giving up production safety.**

---

## Problem

AI coding agents (Codex, Cursor, Claude Code, Copilot, Aider) can modify repositories, write tests, refactor systems, and implement features. The hard question is no longer whether AI can write code — it is whether AI-generated changes can safely reach production.

---

## Solution

AgentGuard is an independent **control plane** between AI coding agents and production. It verifies changes before they ship by:

1. Understanding repository architecture
2. Understanding what changed in a PR
3. Calculating blast radius
4. Identifying security, reliability, database, API, and messaging risks
5. Generating and executing verification requirements
6. Running preview deployments and smoke tests
7. Applying a deterministic deployment policy
8. Issuing an immutable production certificate
9. Monitoring and rolling back when necessary

---

## Vision

Become the **trust layer for autonomous software engineering** — enabling companies to let AI agents perform large portions of software development while keeping deterministic production controls.

---

## Mission

Make autonomous software development safe enough for production by closing the loop from change → evidence → policy → deploy → monitor → rollback.

---

## USP: AI Change Verification

AgentGuard is **not** primarily:

| Not this | Why |
|----------|-----|
| Code reviewer | Review is advisory; AgentGuard requires evidence |
| SAST / vuln scanner | Scanners are inputs, not the product |
| AI coding assistant | Agents create changes; AgentGuard verifies them |
| IDE plugin | Product is a control plane SaaS |
| CI tool | CI is a substrate; AgentGuard owns the trust decision |

Core question:

> **"Has this AI-generated change accumulated enough evidence to safely ship?"**

---

## Production Evidence

Every AI-generated production change produces a **certificate** summarizing risk, blast radius, confidence, evidence categories, and decision (`AUTO DEPLOY` / `BLOCK` / `HUMAN_APPROVAL`).

Certificates are immutable. See [04-database.md](04-database.md) and [16-policy-engine.md](16-policy-engine.md).

---

## Users

| Role | Interest |
|------|----------|
| Senior engineers (primary) | Safer autonomy for AI agents on real repos |
| CTOs / founders | Production risk reduction |
| Platform / DevOps | Deploy controls, previews, rollback |
| Engineering managers | Visibility into AI-driven change risk |
| Security teams | Independent verification of agent changes |

---

## Initial Supported Stack (MVP)

| Area | Support |
|------|---------|
| Languages | Go, Python, TypeScript, JavaScript |
| Databases | PostgreSQL, MySQL, Redis |
| Messaging | Kafka, RabbitMQ, SQS |
| Infrastructure | Docker, GitHub Actions, Terraform, AWS ECS |

---

## Product North Star

Developer asks an agent to implement a feature → PR → AgentGuard analyzes, verifies, may ask the agent to fix issues → preview → certificate → auto-deploy → monitor → rollback if needed. Humans intervene only when evidence is insufficient.

---

## Explicit Non-Goals (MVP)

Do not build initially: Kubernetes orchestration product, mobile apps, 20 languages, enterprise SSO, multi-cloud, complex billing, marketplace, Slack/Jira integrations, advanced analytics, custom LLM training.

See [23-roadmap.md](23-roadmap.md) and [22-billing.md](22-billing.md).
