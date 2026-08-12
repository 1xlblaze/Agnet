#!/usr/bin/env bash
set -euo pipefail
# Apply AgentGuard schema to a Supabase Postgres database.
# Usage: DATABASE_URL='postgresql://...' bash scripts/setup-supabase.sh

DB="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"
if [[ -z "$DB" ]]; then
  echo "Set DATABASE_URL or SUPABASE_DB_URL to your Supabase Postgres connection string" >&2
  exit 1
fi

echo "Applying migrations..."
psql "$DB" -v ON_ERROR_STOP=1 -f supabase/migrations/20260812213700_agentguard_init.sql
echo "Schema applied."
