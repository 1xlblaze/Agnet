# AGENTGUARD

## Production Control Plane for AI Coding Agents

**Version:** 0.1  
**Status:** MVP Specification  
**Primary Goal:** Build a production-grade SaaS that verifies AI-generated software changes before allowing them to reach production.

> **Read this document first.** Detailed topic docs live under [`docs/`](docs/). Implement only the current milestone. See [§80 Codex Operating Rules](#80-codex-operating-rules) and [§81 Codex Milestone Protocol](#81-codex-milestone-protocol).

### Documentation Index

| Doc | Topic |
|-----|-------|
| [00-product-overview.md](docs/00-product-overview.md) | Vision, mission, USP, users |
| [01-prd.md](docs/01-prd.md) | Product requirements |
| [02-architecture.md](docs/02-architecture.md) | System architecture |
| [03-domain-model.md](docs/03-domain-model.md) | Domain entities & lifecycles |
| [04-database.md](docs/04-database.md) | Database schema |
| [05-api.md](docs/05-api.md) | API contract |
| [06-github-integration.md](docs/06-github-integration.md) | GitHub App & webhooks |
| [07-repository-analysis.md](docs/07-repository-analysis.md) | Repository analyzer |
| [08-architecture-graph.md](docs/08-architecture-graph.md) | Architecture graph |
| [09-blast-radius.md](docs/09-blast-radius.md) | Blast radius |
| [10-risk-engine.md](docs/10-risk-engine.md) | Risk engine |
| [11-verification-engine.md](docs/11-verification-engine.md) | Verification & evidence |
| [12-codex-agent.md](docs/12-codex-agent.md) | Coding agent protocol |
| [13-sandbox.md](docs/13-sandbox.md) | Sandbox execution |
| [14-preview-deployment.md](docs/14-preview-deployment.md) | Preview environments |
| [15-production-deployment.md](docs/15-production-deployment.md) | Production deploy & rollback |
| [16-policy-engine.md](docs/16-policy-engine.md) | Deployment policy |
| [17-observability.md](docs/17-observability.md) | Logging, metrics, tracing |
| [18-security.md](docs/18-security.md) | Security model |
| [19-frontend.md](docs/19-frontend.md) | Dashboard & UI |
| [20-infrastructure.md](docs/20-infrastructure.md) | Terraform & AWS |
| [21-testing.md](docs/21-testing.md) | Testing strategy |
| [22-billing.md](docs/22-billing.md) | Pricing (post-MVP) |
| [23-roadmap.md](docs/23-roadmap.md) | Milestones M0–M11 |
| [24-codex-development-rules.md](docs/24-codex-development-rules.md) | Coding agent rules |

---

# 1. Executive Summary

AgentGuard is an AI-agent verification and deployment platform.

Modern coding agents such as:

* OpenAI Codex
* Cursor
* Claude Code
* GitHub Copilot
* Aider

can independently modify repositories, create tests, refactor systems and implement features.

The problem is no longer:

> Can AI write code?

The problem is:

> **Can we safely allow AI-generated changes to reach production?**

AgentGuard provides an independent control plane between an AI coding agent and production.

```text
AI Agent
   ↓
GitHub PR
   ↓
AgentGuard
   ↓
Analyze
   ↓
Understand Architecture
   ↓
Calculate Blast Radius
   ↓
Security Analysis
   ↓
Reliability Analysis
   ↓
Generate Verification Plan
   ↓
Execute Tests
   ↓
Preview Deployment
   ↓
Smoke Tests
   ↓
Production Policy
   ↓
┌───────────────┐
│               │
▼               ▼
BLOCK          DEPLOY
```

---

# 2. Vision

## Vision

Become the **trust layer for autonomous software engineering**.

AgentGuard should eventually allow companies to let AI agents perform large portions of software development while maintaining deterministic production controls.

---

# 3. Mission

AgentGuard should make autonomous software development safe enough for production.

The system should:

1. Understand software architecture.
2. Understand what an AI agent changed.
3. Determine what the change could affect.
4. Identify risks.
5. Generate verification requirements.
6. Execute verification.
7. Deploy safely.
8. Monitor the deployment.
9. Roll back automatically when necessary.

---

# 4. USP

AgentGuard is NOT primarily:

* a code reviewer
* SAST
* vulnerability scanner
* AI coding assistant
* IDE plugin
* CI tool

The core USP is:

# AI Change Verification

AgentGuard answers:

> **"Has this AI-generated change accumulated enough evidence to safely ship?"**

---

# 5. Core Concept: Production Evidence

Every AI-generated production change should result in a certificate.

Example:

```text
AGENTGUARD PRODUCTION CERTIFICATE

Repository:
payments-api

Pull Request:
#184

Commit:
a93f21c

AI Agent:
Codex

Risk Score:
18 / 100

Blast Radius:
21 / 100

Production Confidence:
96 / 100


SECURITY
✓ No secrets
✓ SAST passed
✓ Dependency scan passed

RELIABILITY
✓ Timeout verification
✓ Retry verification
✓ Error handling verified

DATABASE
✓ Migration compatible
✓ Queries verified

API
✓ Contract compatibility verified

MESSAGING
✓ Kafka compatibility verified

TESTING
✓ Unit tests
✓ Integration tests
✓ Regression tests

DEPLOYMENT
✓ Docker build
✓ Preview deployment
✓ Smoke tests

DECISION

AUTO DEPLOY
```

---

# 6. Core Product Loop

```text
                    Developer
                        |
                        v
                 AI Coding Agent
                        |
                        v
                   GitHub PR
                        |
                        v
                +---------------+
                |  AgentGuard   |
                +---------------+
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       Analyze       Security      Architecture
          |             |             |
          +-------------+-------------+
                        |
                        v
                  Blast Radius
                        |
                        v
                   Risk Engine
                        |
                        v
               Verification Plan
                        |
                        v
                 Coding Agent
                        |
                        v
                   Fix / Tests
                        |
                        v
                 Verification
                        |
                        v
                Preview Deploy
                        |
                        v
                  Smoke Tests
                        |
                        v
                Policy Decision
                        |
                +-------+-------+
                |               |
                v               v
              BLOCK           DEPLOY
                                |
                                v
                           Production
                                |
                                v
                            Monitor
                                |
                         +------+------+
                         |             |
                         v             v
                      Healthy       Failure
                         |             |
                         v             v
                        Done        Rollback
```

---

# 7. Users

## Primary user

Senior software engineers / engineering teams using AI coding agents.

## Secondary users

* CTOs
* startup founders
* platform engineering teams
* DevOps teams
* engineering managers
* security teams

---

# 8. Initial Supported Stack

AgentGuard MVP supports:

### Languages

```text
Go
Python
TypeScript
JavaScript
```

### Databases

```text
PostgreSQL
MySQL
Redis
```

### Messaging

```text
Kafka
RabbitMQ
SQS
```

### Infrastructure

```text
Docker
GitHub Actions
Terraform
AWS ECS
```

---

# 9. Architecture

AgentGuard consists of:

```text
Frontend
    |
    v
API
    |
    +-------------------+
    |                   |
    v                   v
PostgreSQL            Redis
    |
    v
Worker
    |
    +------------+
    |            |
    v            v
Analyzer      Agent Runner
    |            |
    v            v
Repository     Sandbox
    |
    v
Architecture Graph
```

---

# 10. Control Plane vs Execution Plane

This separation is mandatory.

## Control Plane

Contains:

```text
API
Database
Policy Engine
Dashboard
GitHub Integration
Risk Engine
Orchestrator
```

## Execution Plane

Contains:

```text
Repository analysis
AI coding agents
Tests
Builds
Preview deployments
Security scanners
```

The execution plane must never have unrestricted access to the control plane.

---

# 11. Technology

## Backend

```text
Go
Gin
pgx
PostgreSQL
Redis
OpenTelemetry
```

## Frontend

```text
Next.js
TypeScript
Tailwind
```

## AI

Provider abstraction:

```go
type LLMProvider interface {
    Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error)
}
```

Coding agent abstraction:

```go
type CodingAgent interface {
    CreatePatch(ctx context.Context, request PatchRequest) (PatchResult, error)
}
```

---

# 12. Repository Structure

```text
agentguard/

apps/
└── web/

services/
├── api/
├── worker/
└── analyzer/

packages/
└── shared/

infrastructure/
└── terraform/

scripts/

docs/

.github/
└── workflows/

docker-compose.yml
Makefile
.env.example
README.md
AGENTGUARD.md
```

---

# 13. API Service

Responsibilities:

* authentication
* project management
* repositories
* PRs
* analyses
* findings
* risk assessments
* verification
* deployments
* certificates

Health:

```http
GET /health
GET /ready
```

---

# 14. API

## Projects

```http
GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

## Repositories

```http
GET /api/v1/repositories
POST /api/v1/repositories
GET /api/v1/repositories/:id
POST /api/v1/repositories/:id/analyze
```

## Pull Requests

```http
GET /api/v1/pull-requests
GET /api/v1/pull-requests/:id
POST /api/v1/pull-requests/:id/analyze
```

## Analysis

```http
GET /api/v1/analyses/:id
POST /api/v1/analyses
```

## Risk

```http
GET /api/v1/risk-assessments/:id
```

## Deployments

```http
GET /api/v1/deployments
GET /api/v1/deployments/:id
POST /api/v1/deployments/:id/rollback
```

## Certificate

```http
GET /api/v1/certificates/:id
```

---

# 15. GitHub Integration

Use a GitHub App.

Do not use personal access tokens for the production architecture.

Required events:

```text
pull_request
push
workflow_run
deployment_status
```

Validate:

```text
X-Hub-Signature-256
```

Every webhook handler must be idempotent.

Store:

```text
github_delivery_id
```

and reject duplicate processing.

---

# 16. Repository Onboarding

Flow:

```text
User
 ↓
Connect GitHub
 ↓
Install AgentGuard
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

Repository baseline contains:

```text
languages
services
APIs
databases
messaging
dependencies
Docker
CI/CD
tests
```

---

# 17. Repository Analyzer

Analyzer interface:

```go
type RepositoryAnalyzer interface {
    Analyze(ctx context.Context, request AnalyzeRequest) (*RepositoryGraph, error)
}
```

Analyzer should detect:

### Languages

```text
Go
Python
JavaScript
TypeScript
```

### Frameworks

```text
Gin
Echo
Fiber
FastAPI
Express
Next.js
```

### Databases

```text
PostgreSQL
MySQL
Redis
```

### Messaging

```text
Kafka
RabbitMQ
SQS
```

### Infrastructure

```text
Docker
Terraform
GitHub Actions
Kubernetes
```

---

# 18. Architecture Graph

The graph contains:

```text
Service
API
Database
Table
Topic
Cache
ExternalService
Dependency
Configuration
```

Relationships:

```text
CALLS
READS
WRITES
PUBLISHES
CONSUMES
DEPENDS_ON
EXPOSES
```

Example:

```text
payment-service
 |
 +-- POST /payments
 |
 +-- PostgreSQL
 |      |
 |      +-- payments
 |
 +-- Redis
 |
 +-- Kafka
        |
        +-- payment-events
              |
              +-- settlement-service
```

---

# 19. Pull Request Analysis

On PR:

```text
GitHub
 ↓
Webhook
 ↓
API
 ↓
Analysis Job
 ↓
Worker
 ↓
Fetch Diff
 ↓
Analyze
```

Capture:

```text
base_sha
head_sha
files_changed
lines_added
lines_removed
symbols_changed
```

---

# 20. Change Intelligence

For every changed file calculate:

```text
language
service
symbols
dependencies
APIs
database operations
messaging operations
external calls
```

---

# 21. Blast Radius

Blast radius measures the potential impact of the change.

Factors:

```text
number of services
number of APIs
database changes
messaging changes
external dependencies
shared libraries
critical paths
```

Example:

```text
BLAST RADIUS

21 / 100

Affected services:
2

Affected APIs:
3

Affected database tables:
2

Affected Kafka topics:
1

Downstream services:
4
```

---

# 22. Risk Engine

Risk dimensions:

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

Each dimension:

```text
0 - 100
```

Overall risk is weighted.

Weights must be configurable.

---

# 23. Risk Severity

```text
0-30    LOW
31-60   MEDIUM
61-80   HIGH
81-100  CRITICAL
```

Note:

Higher score means higher risk.

---

# 24. Security Checks

Detect:

```text
SQL injection
command injection
SSRF
hardcoded secrets
authentication bypass
authorization problems
unsafe deserialization
path traversal
dangerous dependencies
```

Tools:

```text
Semgrep
Trivy
gosec
language-specific scanners
```

---

# 25. Reliability Checks

Detect:

```text
missing timeout
ignored errors
unbounded retries
missing retry backoff
resource leaks
goroutine leaks
unsafe concurrency
missing idempotency
```

---

# 26. Database Checks

Detect:

```text
unsafe migrations
destructive migrations
missing indexes
N+1 queries
transaction boundary changes
large table scans
incompatible schema changes
```

---

# 27. API Compatibility

Detect:

```text
removed endpoint
changed response type
changed field type
removed response field
required request field
authentication changes
HTTP status changes
```

---

# 28. Messaging Compatibility

Detect:

```text
Kafka schema changes
producer/consumer incompatibility
duplicate event risk
missing idempotency
retry problems
ordering changes
```

---

# 29. LLM Analysis

LLM input:

```text
PR description
git diff
architecture graph
blast radius
static findings
test results
repository context
```

LLM output MUST be structured.

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

---

# 30. LLM Trust Model

LLM output is advisory.

The LLM must never directly:

```text
deploy production
delete resources
modify infrastructure
access production database
approve its own changes
```

The deterministic policy engine has final authority.

---

# 31. Verification Engine

Every important finding creates verification requirements.

Example:

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

# 32. Verification Evidence

Evidence types:

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

# 33. Coding Agent

Coding agent abstraction:

```go
type CodingAgent interface {
    CreatePatch(ctx context.Context, request PatchRequest) (*PatchResult, error)
}
```

Initial implementation:

```text
Codex
```

Future:

```text
Claude Code
Cursor
other agents
```

---

# 34. Agent Loop

```text
Finding
 ↓
Fix specification
 ↓
Codex
 ↓
Patch
 ↓
Tests
 ↓
Analysis
 ↓
Verification
```

Maximum:

```text
3 iterations
```

After 3 failures:

```text
HUMAN_APPROVAL_REQUIRED
```

---

# 35. Sandbox

Every autonomous execution occurs in a sandbox.

Requirements:

```text
CPU limit
memory limit
timeout
filesystem isolation
network restriction
temporary credentials
audit logging
```

The sandbox must not contain:

```text
production credentials
control-plane credentials
long-lived GitHub tokens
```

---

# 36. Preview Deployment

For eligible PRs:

```text
PR
 ↓
Docker Build
 ↓
ECR
 ↓
Ephemeral ECS
 ↓
Health Check
 ↓
Smoke Test
```

Example:

```text
https://pr-184.preview.agentguard.example.com
```

---

# 37. Preview Lifecycle

Create:

```text
PR OPENED
```

Destroy:

```text
PR CLOSED
PR MERGED
TTL EXPIRED
```

Default TTL:

```text
4 hours
```

Make configurable.

---

# 38. Production Deployment

Initial architecture:

```text
GitHub
 ↓
GitHub Actions
 ↓
Docker
 ↓
ECR
 ↓
ECS Fargate
 ↓
ALB
 ↓
Application
```

---

# 39. Deployment Policy

Example:

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

Decision:

```text
ALLOW
BLOCK
HUMAN_APPROVAL
```

---

# 40. Automatic Deployment

Deployment occurs only when all mandatory evidence exists.

```text
Risk <= threshold
AND
Critical findings == 0
AND
High findings == 0
AND
Tests pass
AND
Preview passes
AND
Smoke tests pass
AND
Policy allows
```

---

# 41. Rollback

Track:

```text
current_version
previous_version
```

Trigger rollback if:

```text
5xx rate exceeds threshold
health checks fail
latency exceeds threshold
deployment becomes unhealthy
```

Rollback must be auditable.

---

# 42. Production Monitoring

Initial metrics:

```text
request count
5xx rate
latency
CPU
memory
health
deployment status
```

Use:

```text
CloudWatch
OpenTelemetry
```

---

# 43. Database Model

Core entities:

```text
organizations
users
projects
repositories
repository_scans
pull_requests
analyses
findings
risk_assessments
verification_runs
agent_runs
deployments
deployment_events
certificates
```

---

# 44. Organization

```text
organizations
----------------
id
name
created_at
updated_at
```

---

# 45. User

```text
users
----------------
id
github_user_id
email
name
created_at
updated_at
```

---

# 46. Project

```text
projects
----------------
id
organization_id
name
description
status
created_at
updated_at
```

---

# 47. Repository

```text
repositories
----------------
id
project_id
github_repository_id
owner
name
default_branch
installation_id
status
created_at
updated_at
```

---

# 48. Pull Request

```text
pull_requests
----------------
id
repository_id
github_pr_number
base_sha
head_sha
title
author
status
created_at
updated_at
```

---

# 49. Analysis

```text
analyses
----------------
id
pull_request_id
status
started_at
completed_at
error
created_at
```

---

# 50. Finding

```text
findings
----------------
id
analysis_id
severity
category
title
description
file
line
evidence
recommendation
confidence
status
created_at
```

---

# 51. Risk Assessment

```text
risk_assessments
----------------
id
analysis_id
security_score
reliability_score
performance_score
database_score
api_score
messaging_score
testing_score
deployment_score
blast_radius
overall_risk
decision
created_at
```

---

# 52. Agent Run

```text
agent_runs
----------------
id
analysis_id
provider
task
status
iteration
started_at
completed_at
input_tokens
output_tokens
error
```

---

# 53. Deployment

```text
deployments
----------------
id
project_id
pull_request_id
environment
version
status
started_at
completed_at
rollback_of
```

---

# 54. Certificate

```text
certificates
----------------
id
deployment_id
risk_score
blast_radius
evidence
decision
commit_sha
created_at
```

Certificates are immutable.

---

# 55. Frontend

Pages:

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

# 56. Dashboard

Show:

```text
Production Confidence

96 / 100

Security       98
Reliability    94
Performance    92
Architecture   95
Database       97

Latest PR

#184
Optimize payment processing

Risk:
18 / 100

Blast Radius:
21 / 100

Decision:
AUTO DEPLOY
```

---

# 57. PR Detail

Display:

```text
PR
Agent
Commit
Files changed
Blast radius
Risk
Findings
Verification
Preview
Deployment
Certificate
```

---

# 58. Finding UI

Each finding:

```text
Severity
Category
File
Line
Description
Evidence
Recommendation
Confidence
Status
```

Example:

```text
HIGH

Reliability

payment/service.go:84

Payment retry is not idempotent.

Evidence:
Retry path can execute the database write twice.

Recommendation:
Introduce an idempotency key.

Confidence:
94%
```

---

# 59. Security Architecture

AgentGuard must follow:

```text
least privilege
zero trust
short-lived credentials
encrypted secrets
sandbox execution
audit logging
```

Never store raw cloud credentials in database.

Use:

```text
AWS Secrets Manager
```

---

# 60. Authentication

MVP:

```text
GitHub OAuth
```

Authorization:

```text
Organization
 ↓
Members
 ↓
Projects
 ↓
Repositories
```

---

# 61. Observability

Every request/job:

```text
request_id
trace_id
span_id
```

Metrics:

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

---

# 62. Logging

Use structured JSON.

Example:

```json
{
  "level": "info",
  "service": "worker",
  "event": "analysis_completed",
  "analysis_id": "abc",
  "duration_ms": 1823
}
```

Never log:

```text
passwords
tokens
API keys
secrets
repository credentials
```

---

# 63. Error Handling

All services must:

* return meaningful errors
* use timeouts
* retry transient operations
* use exponential backoff
* avoid infinite retries
* expose failure state

---

# 64. Idempotency

Webhook handlers and jobs must be idempotent.

Examples:

```text
same GitHub webhook
same analysis job
same deployment event
```

must not produce duplicate state.

---

# 65. Testing Strategy

## Unit

Required for:

```text
risk engine
blast radius
policy engine
configuration
API handlers
repository parsers
```

## Integration

Required for:

```text
PostgreSQL
Redis
GitHub webhook
worker
analysis pipeline
```

## End-to-end

Eventually:

```text
Create project
 ↓
Connect repo
 ↓
PR
 ↓
Analyze
 ↓
Verify
 ↓
Deploy
```

---

# 66. Local Development

Docker Compose:

```text
PostgreSQL
Redis
API
Worker
Analyzer
Web
```

Command:

```bash
make dev
```

Tests:

```bash
make test
```

Lint:

```bash
make lint
```

Build:

```bash
make build
```

---

# 67. Environment Variables

Provide:

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

Never commit values.

Only `.env.example` is committed.

---

# 68. CI

Every PR must run:

```text
format
lint
unit tests
integration tests
build
security scan
```

CI must fail if any mandatory check fails.

---

# 69. Infrastructure

Terraform structure:

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

# 70. Automatic Repository Creation

User chooses:

```text
Create Project
```

AgentGuard creates:

```text
GitHub repository
README
source code
Dockerfile
tests
CI
Terraform
```

Initial template:

```text
Go
Gin
PostgreSQL
```

---

# 71. Automatic Deployment

Generated project:

```text
GitHub
 ↓
GitHub Actions
 ↓
Docker
 ↓
ECR
 ↓
ECS
 ↓
ALB
```

After successful deployment:

```text
Project URL
Health
Version
Deployment status
```

---

# 72. Project Lifecycle

```text
CREATED
   ↓
INITIALIZING
   ↓
READY
   ↓
DEPLOYING
   ↓
RUNNING
   ↓
FAILED
   ↓
ROLLING_BACK
```

---

# 73. AI Agent Lifecycle

```text
REQUESTED
   ↓
RUNNING
   ↓
PATCH_CREATED
   ↓
TESTING
   ↓
VERIFICATION
   ↓
COMPLETED
```

Failure:

```text
FAILED
```

---

# 74. Analysis Lifecycle

```text
QUEUED
 ↓
CLONING
 ↓
ANALYZING
 ↓
GRAPH_BUILDING
 ↓
RISK_ANALYSIS
 ↓
VERIFYING
 ↓
COMPLETED
```

---

# 75. Deployment Lifecycle

```text
QUEUED
 ↓
BUILDING
 ↓
PREVIEWING
 ↓
VERIFYING
 ↓
APPROVED
 ↓
DEPLOYING
 ↓
HEALTH_CHECK
 ↓
COMPLETED
```

Failure:

```text
FAILED
 ↓
ROLLBACK
```

---

# 76. Pricing — Future

Do not implement billing in the MVP.

Potential model:

### Free

```text
1 repository
5 analyses/month
```

### Pro

```text
$29/month
```

### Team

```text
$199/month
```

### Enterprise

Custom.

Additional revenue:

```text
AI agent execution
preview environments
large repository analysis
enterprise deployment controls
```

---

# 77. MVP Roadmap

## M0

Foundation:

```text
Go
Next.js
Postgres
Redis
Docker
CI
```

## M1

GitHub:

```text
OAuth
GitHub App
repositories
webhooks
PR events
```

## M2

Analyzer:

```text
repository
diff
language
dependencies
APIs
DB
messaging
```

## M3

Graph:

```text
architecture graph
dependency graph
```

## M4

Blast Radius:

```text
impact calculation
```

## M5

Risk:

```text
security
reliability
performance
database
API
messaging
```

## M6

AI:

```text
LLM analysis
structured findings
```

## M7

Verification:

```text
tests
security
evidence
```

## M8

Codex:

```text
agent
sandbox
fix loop
```

## M9

Preview:

```text
ECR
ECS
preview
smoke tests
```

## M10

Production:

```text
policy
deploy
monitor
rollback
```

## M11

Project Generator:

```text
GitHub repo
template
infrastructure
deployment
```

---

# 78. What NOT to Build Initially

Do not build:

```text
Kubernetes
mobile application
20 programming languages
enterprise SSO
multi-cloud
complex billing
marketplace
Slack integration
Jira integration
advanced analytics
custom LLM training
```

These are post-MVP.

---

# 79. Product North Star

The product should eventually allow this:

```text
Developer:

"Build payment retry support."

             ↓

Codex

             ↓

PR

             ↓

AgentGuard

             ↓

Architecture Analysis

             ↓

Blast Radius

             ↓

Risk

             ↓

Verification

             ↓

Codex fixes issues

             ↓

Tests

             ↓

Preview

             ↓

Evidence

             ↓

Policy

             ↓

Production

             ↓

Monitoring

             ↓

Automatic Rollback if required
```

The developer should only need to intervene when AgentGuard cannot establish sufficient evidence.

---

# 80. Codex Operating Rules

This section is extremely important.

Codex must obey:

### Rule 1

Read `AGENTGUARD.md` before modifying the repository.

### Rule 2

Never implement future milestones unless explicitly instructed.

### Rule 3

Inspect existing code before creating new code.

### Rule 4

Do not rewrite working code unnecessarily.

### Rule 5

Every feature requires tests.

### Rule 6

Do not fake integrations.

### Rule 7

Never hardcode secrets.

### Rule 8

Never commit `.env`.

### Rule 9

Never give autonomous agents production credentials.

### Rule 10

Never allow an LLM response to directly authorize deployment.

### Rule 11

Run:

```bash
go test ./...
go vet ./...
```

for Go changes.

### Rule 12

Run frontend tests/build for frontend changes.

### Rule 13

Run Docker builds before declaring infrastructure work complete.

### Rule 14

Update documentation when public interfaces change.

### Rule 15

Keep changes small and reviewable.

---

# 81. Codex Milestone Protocol

For every milestone Codex must:

```text
1. Read AGENTGUARD.md.
2. Inspect repository state.
3. Identify current milestone.
4. Implement only that milestone.
5. Write tests.
6. Run tests.
7. Run lint.
8. Build.
9. Fix failures.
10. Update documentation.
11. Show changed files.
12. Show test results.
13. Stop.
```

Codex must NOT automatically continue.

---

# 82. M0 Codex Prompt

Use this first:

```text
Read AGENTGUARD.md completely.

We are starting AgentGuard development.

Implement M0 only.

M0 requirements:

1. Create the monorepo structure.
2. Create the Go API service.
3. Create the Go worker service.
4. Create the Go analyzer service.
5. Create the Next.js TypeScript frontend.
6. Add PostgreSQL.
7. Add Redis.
8. Add Docker Compose.
9. Add Makefile.
10. Add .env.example.
11. Add GitHub Actions CI.
12. Add API /health endpoint.
13. Add API /ready endpoint.
14. Add structured logging.
15. Add configuration management.
16. Add graceful shutdown.
17. Add basic tests.
18. Ensure every service builds.
19. Ensure Docker Compose starts.
20. Update README.

Do NOT implement:

- GitHub OAuth
- GitHub App
- repository analysis
- architecture graph
- blast radius
- risk engine
- LLM
- Codex integration
- deployment
- Terraform
- billing

Those belong to future milestones.

Before finishing:

go test ./...
go vet ./...
build all services
build frontend
verify Docker Compose

Fix all failures.

Then provide:

1. Summary
2. Files created
3. Architecture
4. Commands executed
5. Test results
6. Known TODOs

STOP after M0.
```

---

# 83. First Major Demo

Once M0–M10 are complete, the demo should be:

```text
Open AgentGuard

        ↓

"Create Project"

        ↓

payments-api

        ↓

AgentGuard automatically creates:

GitHub repo
Go application
Postgres
Docker
CI
AWS infrastructure

        ↓

Codex receives:

"Add payment retry."

        ↓

Codex creates PR

        ↓

AgentGuard automatically:

Analyzes PR
Builds graph
Calculates blast radius
Runs security checks
Finds duplicate payment risk

        ↓

AgentGuard asks Codex to fix it

        ↓

Codex creates tests

        ↓

AgentGuard verifies

        ↓

Preview deploy

        ↓

Smoke tests

        ↓

Production certificate

        ↓

AUTO DEPLOY

        ↓

Production

        ↓

Monitoring
```

That is the **wow moment**.

---

# 84. The Product in One Sentence

> **AgentGuard lets engineering teams give AI coding agents more autonomy without giving up production safety.**

---

# 85. Final Architecture

```text
                         AGENTGUARD
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
      CONTROL PLANE                         EXECUTION PLANE
          |                                       |
      Next.js                                  Sandbox
          |                                       |
         API                                  Analyzer
          |                                       |
     PostgreSQL                              Test Runner
          |                                       |
        Redis                                  Codex
          |                                       |
      Orchestrator                           Docker
          |                                       |
      Policy Engine                         Preview Env
          |                                       |
      GitHub App                            Deployment
          |                                       |
          +-------------------+-------------------+
                              |
                              v
                          Production
                              |
                              v
                         Monitoring
                              |
                    +---------+---------+
                    |                   |
                  Healthy             Failure
                    |                   |
                    v                   v
                   Done              Rollback
```

---

## Immediate Next Step

Implement **M0 only** using the prompt in [§82](#82-m0-codex-prompt).

Do not build the whole product in one shot. After each milestone, review architecture, security, code quality, and whether the work advances the USP: **AI change verification with production evidence**.
