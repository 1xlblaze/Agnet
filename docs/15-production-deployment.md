# 15 — Production Deployment

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [14-preview-deployment.md](14-preview-deployment.md), [16-policy-engine.md](16-policy-engine.md), Milestone M10

---

## Initial Architecture

```text
GitHub → GitHub Actions → Docker → ECR → ECS Fargate → ALB → Application
```

---

## Automatic Deployment Conditions

All mandatory evidence must exist:

```text
Risk <= threshold
AND Critical findings == 0
AND High findings == 0
AND Tests pass
AND Preview passes
AND Smoke tests pass
AND Policy allows
```

---

## Lifecycle

```text
QUEUED → BUILDING → PREVIEWING → VERIFYING → APPROVED → DEPLOYING → HEALTH_CHECK → COMPLETED
                                                                     ↘ FAILED → ROLLBACK
```

---

## Rollback

Track `current_version` and `previous_version` (via `deployments.rollback_of`).

Trigger rollback if:

```text
5xx rate exceeds threshold
health checks fail
latency exceeds threshold
deployment becomes unhealthy
```

Rollback must be auditable (`deployment_events`).

---

## Monitoring

Initial metrics: request count, 5xx rate, latency, CPU, memory, health, deployment status.

Use CloudWatch + OpenTelemetry. See [17-observability.md](17-observability.md).

---

## Generated Project Auto-Deploy (M11)

After project generator creates repo + infra:

```text
GitHub → Actions → Docker → ECR → ECS → ALB
```

Expose project URL, health, version, deployment status in UI.
