# 14 — Preview Deployment

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [15-production-deployment.md](15-production-deployment.md), Milestone M9

---

## Flow (eligible PRs)

```text
PR → Docker Build → ECR → Ephemeral ECS → Health Check → Smoke Test
```

Example URL:

```text
https://pr-184.preview.agentguard.example.com
```

---

## Lifecycle

**Create on:** `PR OPENED` (and updates as needed)

**Destroy on:**

```text
PR CLOSED
PR MERGED
TTL EXPIRED
```

**Default TTL:** 4 hours (configurable).

---

## Evidence

Successful preview + smoke tests produce `PREVIEW_RESULT` and `SMOKE_TEST` evidence for the verification/policy engines.

---

## Constraints

- Ephemeral infra only; no shared production data stores.
- Short-lived credentials.
- Cost controls: TTL + destroy on PR close/merge.
