# 16 — Policy Engine

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [10-risk-engine.md](10-risk-engine.md), [11-verification-engine.md](11-verification-engine.md), Milestone M10

---

## Authority

The **deterministic policy engine** has final authority over deploy decisions. LLM/agent output is advisory and cannot authorize deployment.

---

## Example Policy

```yaml
deployment_policy:
  max_risk_score: 30
  max_blast_radius: 50
  critical_findings: 0
  high_findings: 0
  tests_required: true
  preview_required: true
  smoke_tests_required: true
```

---

## Decisions

```text
ALLOW
BLOCK
HUMAN_APPROVAL
```

---

## Evaluation Inputs

- Overall risk + dimension scores
- Blast radius
- Finding counts by severity
- Verification evidence completeness
- Preview/smoke results
- Org/project policy overrides (future)

---

## Output

Decision stored on risk assessment / deployment certificate. UI must show why a change was blocked or required human approval.
