# 06 — GitHub Integration

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [05-api.md](05-api.md), [18-security.md](18-security.md), Milestone M1

---

## Principles

- Use a **GitHub App** for production architecture.
- Do **not** use personal access tokens for the production architecture.
- Validate `X-Hub-Signature-256` on every webhook.
- Every webhook handler must be **idempotent**.
- Store `github_delivery_id` and reject duplicate processing.

---

## Authentication (MVP)

GitHub OAuth for user login. Authorization hierarchy:

```text
Organization → Members → Projects → Repositories
```

---

## Required Webhook Events

```text
pull_request
push
workflow_run
deployment_status
```

---

## Onboarding Flow

```text
User
 ↓
Connect GitHub
 ↓
Install AgentGuard GitHub App
 ↓
Select repository
 ↓
AgentGuard clones repository
 ↓
Initial analysis
 ↓
Architecture graph
 ↓
Repository baseline
```

Baseline fields: languages, services, APIs, databases, messaging, dependencies, Docker, CI/CD, tests.

---

## PR Analysis Trigger

```text
GitHub → Webhook → API → Analysis Job → Worker → Fetch Diff → Analyze
```

Capture: `base_sha`, `head_sha`, `files_changed`, `lines_added`, `lines_removed`, `symbols_changed`.

---

## Credentials

- App JWT → installation access tokens (short-lived).
- Never store long-lived GitHub tokens in sandboxes.
- Private key via AWS Secrets Manager / env — never commit.

Env vars:

```text
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
```

---

## Idempotency

Same delivery ID must not create duplicate analyses or deployments. Use unique constraint on `github_delivery_id` and short-circuit if already processed.
