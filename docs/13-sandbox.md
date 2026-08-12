# 13 — Sandbox

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [02-architecture.md](02-architecture.md), [18-security.md](18-security.md), Milestone M8

---

## Rule

Every autonomous execution occurs in a sandbox (analysis helpers, tests, builds, coding agent runs, scanners as applicable).

---

## Requirements

```text
CPU limit
memory limit
timeout
filesystem isolation
network restriction
temporary credentials
audit logging
```

---

## Must NOT Contain

```text
production credentials
control-plane credentials
long-lived GitHub tokens
```

---

## Network

Default deny egress except allowlisted package registries / GitHub / required APIs for the job. Prefer ephemeral credentials with minimal scopes.

---

## Audit

Log: job id, analysis id, sandbox id, start/end, exit code, resource usage. Never log secrets.
