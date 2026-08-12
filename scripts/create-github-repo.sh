#!/usr/bin/env bash
set -euo pipefail
REPO_NAME="${REPO_NAME:-agentguard}"
VISIBILITY="${VISIBILITY:-public}"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "GH_TOKEN (or GITHUB_TOKEN) is required" >&2
  exit 1
fi

export GH_TOKEN="$TOKEN"
gh auth status >/dev/null

# Create repo under authenticated user
if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo already accessible: $REPO_NAME"
else
  gh repo create "$REPO_NAME" --"$VISIBILITY" --description "Production control plane for AI coding agents" --source=. --remote=origin --push || {
    # If source push fails because remote exists differently, create empty then push
    gh repo create "$REPO_NAME" --"$VISIBILITY" --description "Production control plane for AI coding agents" || true
  }
fi

OWNER=$(gh api user -q .login)
REMOTE="https://github.com/${OWNER}/${REPO_NAME}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M main
# Keep feature branch history; also push current branch
CURRENT=$(git branch --show-current)
git push -u origin "$CURRENT"
git push -u origin "$CURRENT":main || true
echo "Repository: https://github.com/${OWNER}/${REPO_NAME}"
