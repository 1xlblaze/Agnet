# 25 — Supabase + Vercel Deployment

## Target architecture

```text
Browser → Vercel (Next.js apps/web)
              ├── UI pages
              └── /api/v1/* route handlers
                        ↓
                 Supabase Postgres
```

Go services remain for local/dev Docker Compose. Production SaaS path uses Next.js API routes on Vercel with Supabase as the database.

## Setup

1. Create a Supabase project.
2. Copy the **database connection string** (prefer pooler / transaction mode for serverless) into `DATABASE_URL` / `SUPABASE_DB_URL`.
3. Copy project URL + **service role** key into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply schema: `bash scripts/setup-supabase.sh`
5. Create GitHub repo: `GH_TOKEN=... bash scripts/create-github-repo.sh`
6. Deploy: `VERCEL_TOKEN=... bash scripts/deploy-vercel.sh`

## Vercel project settings

- Root Directory: `apps/web`
- Framework: Next.js
- Env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_API_URL=` (empty for same-origin)

## Security

- RLS enabled on all tables; no public anon policies in MVP (service role only from server routes).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
