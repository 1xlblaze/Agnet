# 20 — Infrastructure

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [15-production-deployment.md](15-production-deployment.md), Milestone M0 (Compose) / later Terraform

---

## Local (M0)

Docker Compose:

```text
PostgreSQL
Redis
API
Worker
Analyzer
Web
```

Commands: `make dev`, `make test`, `make lint`, `make build`.

---

## Environment Variables

```text
DATABASE_URL=
REDIS_URL=

GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

OPENAI_API_KEY=

AWS_REGION=
AWS_ROLE_ARN=
AWS_ACCOUNT_ID=

S3_BUCKET=
ECR_REPOSITORY=
```

Never commit values. Only `.env.example` is committed.

---

## Terraform Structure

```text
terraform/
modules/
├── network
├── ecs
├── rds
├── redis
├── ecr
├── iam
├── alb
└── secrets
environments/
└── dev
```

Production infrastructure must be separated from development.

---

## CI

Every PR must run: format, lint, unit tests, integration tests, build, security scan. Fail closed on mandatory checks.

---

## Cloud Target for Customer Apps

GitHub Actions → Docker → ECR → ECS Fargate → ALB.

Do not build Kubernetes-as-product in MVP.
