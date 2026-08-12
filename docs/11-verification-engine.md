# 11 — Verification Engine

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [10-risk-engine.md](10-risk-engine.md), [12-codex-agent.md](12-codex-agent.md), Milestone M7

---

## Purpose

Translate findings into **verification requirements**, execute them, and store **evidence** proving the change is safe enough to ship.

---

## Example

```text
Finding:
Payment retry can duplicate transactions.

Verification:
[ ] duplicate request test
[ ] idempotency test
[ ] transaction test
[ ] retry test
```

---

## Evidence Types

```text
TEST_RESULT
STATIC_SCAN
DEPENDENCY_SCAN
BUILD_RESULT
PREVIEW_RESULT
SMOKE_TEST
API_CONTRACT
DATABASE_CHECK
MESSAGING_CHECK
PERFORMANCE_TEST
```

---

## Flow

```text
Findings → Verification Plan → Execute (sandbox) → Evidence Store → Policy Inputs
```

If requirements fail, agent loop may attempt fixes (max 3) before `HUMAN_APPROVAL_REQUIRED`.

---

## Rules

1. Important findings create mandatory verification items.
2. Evidence must be durable and inspectable from the UI/API.
3. Missing mandatory evidence ⇒ cannot `ALLOW` deploy.
4. Do not fake integrations or fabricate evidence (Codex Rule 6).
