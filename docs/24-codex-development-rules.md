# 24 — Codex Development Rules

**Status:** Binding for all implementation agents  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [23-roadmap.md](23-roadmap.md)

---

## Operating Rules

1. Read `AGENTGUARD.md` before modifying the repository.
2. Never implement future milestones unless explicitly instructed.
3. Inspect existing code before creating new code.
4. Do not rewrite working code unnecessarily.
5. Every feature requires tests.
6. Do not fake integrations.
7. Never hardcode secrets.
8. Never commit `.env`.
9. Never give autonomous agents production credentials.
10. Never allow an LLM response to directly authorize deployment.
11. Run `go test ./...` and `go vet ./...` for Go changes.
12. Run frontend tests/build for frontend changes.
13. Run Docker builds before declaring infrastructure work complete.
14. Update documentation when public interfaces change.
15. Keep changes small and reviewable.

---

## Milestone Protocol

For every milestone:

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

**Do NOT automatically continue to the next milestone.**

---

## M0 Prompt (copy/paste)

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

## Review Loop

After each milestone, human/architect reviews: architecture fit, security invariants, code quality, and whether the USP (AI change verification with production evidence) advanced.
