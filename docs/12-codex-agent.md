# 12 — Coding Agent Protocol

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [13-sandbox.md](13-sandbox.md), [24-codex-development-rules.md](24-codex-development-rules.md), Milestone M8

---

## Abstraction

```go
type CodingAgent interface {
    CreatePatch(ctx context.Context, request PatchRequest) (*PatchResult, error)
}
```

Initial implementation: **Codex**. Future: Claude Code, Cursor, others.

---

## Agent Loop

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

**Maximum iterations: 3.** After 3 failures → `HUMAN_APPROVAL_REQUIRED`.

---

## Lifecycle

```text
REQUESTED → RUNNING → PATCH_CREATED → TESTING → VERIFICATION → COMPLETED
                                                              ↘ FAILED
```

Track `agent_runs` with provider, task, iteration, tokens, errors.

---

## Constraints

- Execute only inside sandbox ([13-sandbox.md](13-sandbox.md)).
- No production or control-plane credentials.
- Patches go through normal PR/analysis path — agent cannot self-approve deploy.
- LLM/agent output never authorizes deployment (Rule 10).

---

## PatchRequest (conceptual)

Include: finding IDs, fix specification, relevant files, failing tests, repository constraints, iteration count.

## PatchResult (conceptual)

Include: diff/patch reference, summary, files touched, test commands suggested, error if failed.
