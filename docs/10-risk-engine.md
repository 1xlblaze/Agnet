# 10 — Risk Engine

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [09-blast-radius.md](09-blast-radius.md), [11-verification-engine.md](11-verification-engine.md), [16-policy-engine.md](16-policy-engine.md), Milestone M5

---

## Dimensions (each 0–100)

```text
Security
Reliability
Performance
Database
API Compatibility
Messaging
Concurrency
Observability
Testing
Deployment
```

Overall risk is a **weighted** combination. Weights must be configurable. **Higher score = higher risk.**

---

## Severity Bands

```text
0-30    LOW
31-60   MEDIUM
61-80   HIGH
81-100  CRITICAL
```

---

## Security Checks

Detect: SQL injection, command injection, SSRF, hardcoded secrets, authn/authz bypass, unsafe deserialization, path traversal, dangerous dependencies.

Tools: Semgrep, Trivy, gosec, language-specific scanners.

---

## Reliability Checks

Detect: missing timeout, ignored errors, unbounded retries, missing retry backoff, resource leaks, goroutine leaks, unsafe concurrency, missing idempotency.

---

## Database Checks

Detect: unsafe/destructive migrations, missing indexes, N+1 queries, transaction boundary changes, large table scans, incompatible schema changes.

---

## API Compatibility

Detect: removed endpoint, changed response/field types, removed response fields, newly required request fields, authentication changes, HTTP status changes.

---

## Messaging Compatibility

Detect: Kafka schema changes, producer/consumer incompatibility, duplicate event risk, missing idempotency, retry problems, ordering changes.

---

## LLM Analysis (advisory)

**Inputs:** PR description, git diff, architecture graph, blast radius, static findings, test results, repository context.

**Output MUST be structured:**

```json
{
  "findings": [
    {
      "severity": "high",
      "category": "reliability",
      "title": "Duplicate payment risk",
      "description": "...",
      "evidence": [],
      "recommendation": "...",
      "confidence": 0.94
    }
  ]
}
```

### LLM Trust Model

LLM output is advisory. The LLM must never directly: deploy production, delete resources, modify infrastructure, access production database, or approve its own changes. The deterministic policy engine has final authority.

---

## Persistence

Store in `risk_assessments` per analysis. Feed findings into verification requirements.
