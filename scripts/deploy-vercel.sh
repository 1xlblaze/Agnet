#!/usr/bin/env bash
set -euo pipefail
TOKEN="${VERCEL_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "VERCEL_TOKEN is required" >&2
  exit 1
fi

cd "$(dirname "$0")/.."
npx vercel pull --yes --token="$TOKEN" --environment=production || true
npx vercel link --yes --token="$TOKEN" --project agentguard || npx vercel link --yes --token="$TOKEN"

# Ensure env vars exist on Vercel project (caller should set them in dashboard or via CLI)
REQUIRED=(DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_SUPABASE_URL)
for k in "${REQUIRED[@]}"; do
  if [[ -n "${!k:-}" ]]; then
    echo "Setting $k on Vercel..."
    printf '%s' "${!k}" | npx vercel env add "$k" production --token="$TOKEN" --force 2>/dev/null || \
      printf '%s' "${!k}" | npx vercel env add "$k" production --token="$TOKEN" || true
  fi
done

# Deploy from apps/web as root
cd apps/web
npx vercel --prod --token="$TOKEN" --yes | tee /tmp/vercel-deploy.out
echo "Deploy finished. URL above."
