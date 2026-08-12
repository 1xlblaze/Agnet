# 17 — Observability

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [18-security.md](18-security.md), Milestone M0+

---

## Correlation

Every request/job must carry:

```text
request_id
trace_id
span_id
```

Use OpenTelemetry.

---

## Metrics

```text
analysis_duration
analysis_success
analysis_failure
agent_iterations
agent_failure
test_duration
preview_duration
deployment_duration
rollback_count
```

Customer app production metrics (M10): request count, 5xx rate, latency, CPU, memory, health, deployment status (CloudWatch + OTel).

---

## Logging

Structured JSON only.

```json
{
  "level": "info",
  "service": "worker",
  "event": "analysis_completed",
  "analysis_id": "abc",
  "duration_ms": 1823
}
```

### Never log

```text
passwords
tokens
API keys
secrets
repository credentials
```

---

## Error Handling

All services must:

* return meaningful errors
* use timeouts
* retry transient operations with exponential backoff
* avoid infinite retries
* expose failure state

---

## Idempotency

Webhook handlers and jobs must be idempotent (same webhook, analysis job, deployment event → no duplicate state).
