# 26 — Agent Studio (OpenHands-style flows)

**Status:** MVP v0.1  
**Related:** [01-prd.md](01-prd.md), [23-roadmap.md](23-roadmap.md)

---

## Purpose

AgentGuard Studio adds **user-composable agent pipelines** inspired by [OpenHands](https://www.openhands.dev/):

- **PRD → production** — paste a product brief; the platform runs planning, coding, PR, verification, and deploy steps.
- **Custom flows** — enable, disable, and reorder steps (policy gate, human approval, preview, etc.).
- **Control plane** — the same AgentGuard analyze / verify / certificate loop gates production.

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Marketing landing (Studio) |
| `/dashboard` | Repository health dashboard |
| `/flows` | List flows and templates |
| `/flows/new` | Flow builder |
| `/flows/[id]` | Run flow with PRD, view step timeline |

---

## API

- `GET/POST /api/v1/flows`
- `GET/PATCH /api/v1/flows/:id`
- `POST /api/v1/flows/:id/run` — body `{ "prd_text": "..." }`

---

## Data model

See `migrations/002_agent_flows.sql`: `agent_flows`, `flow_runs`.

When `DATABASE_URL` is unset, flows run in an in-memory store for local UI demos.
