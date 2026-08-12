# 21 — Testing Strategy

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [24-codex-development-rules.md](24-codex-development-rules.md)

---

## Unit (required)

```text
risk engine
blast radius
policy engine
configuration
API handlers
repository parsers
```

---

## Integration (required)

```text
PostgreSQL
Redis
GitHub webhook
worker
analysis pipeline
```

---

## End-to-End (eventually)

```text
Create project → Connect repo → PR → Analyze → Verify → Deploy
```

---

## Agent Verification Gates

For Go changes:

```bash
go test ./...
go vet ./...
```

For frontend changes: run frontend tests/build.

For infrastructure: run Docker builds before declaring complete.

Every feature requires tests. Do not fake integrations.
