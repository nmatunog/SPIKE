#!/usr/bin/env bash
# Commit and push after a successful build. Cloudflare Pages deploys via GitHub Actions on push to main.
#
# Usage:
#   SHIP_COMMIT_MSG="feat: my change" ./scripts/ship-after-build.sh
#   ./scripts/ship-after-build.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/.cursor/logs"
LOG="$LOG_DIR/ship-after-build.log"

mkdir -p "$LOG_DIR"
exec >>"$LOG" 2>&1

echo ""
echo "════════════════════════════════════════════════════════"
echo " ship-after-build started $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "════════════════════════════════════════════════════════"

cd "$ROOT"

if [[ -f "$ROOT/scripts/run-supabase-migrations.sh" ]]; then
  echo "→ Checking Supabase migrations..."
  bash "$ROOT/scripts/run-supabase-migrations.sh" || echo "→ db:migrate failed (see log); continuing ship"
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "→ Not a git repository; skipping ship"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "→ Branch is '$BRANCH' (not main); skipping auto-ship"
  exit 0
fi

echo "→ Staging changes (excluding secrets and logs)..."
git add -A
git reset HEAD -- .env api/.env .env.local .env.cloud.local .cursor/logs 2>/dev/null || true

if git diff --cached --quiet; then
  echo "→ Nothing to commit; skipping push"
  exit 0
fi

if [[ -n "${SHIP_COMMIT_MSG:-}" ]]; then
  COMMIT_MESSAGE="$SHIP_COMMIT_MSG"
else
  CHANGED="$(git diff --cached --name-only | head -12 | tr '\n' ', ' | sed 's/, $//' | sed 's/, $//')"
  COMMIT_MESSAGE="$(cat <<EOF
chore: ship build — ${CHANGED:-dev revisions}

Automated commit after successful build ($(date -u +"%Y-%m-%d %H:%M UTC")).
EOF
)"
fi

echo "→ Committing..."
git commit -m "$COMMIT_MESSAGE"
echo "→ Committed $(git rev-parse --short HEAD)"

if ! git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  echo "→ No upstream; pushing with -u origin HEAD"
  git push -u origin HEAD
else
  echo "→ Pushing to upstream..."
  git push
fi

echo "→ Push complete; GitHub Actions will deploy to Cloudflare Pages"

if command -v gh >/dev/null 2>&1; then
  RUN_ID="$(gh run list --workflow=deploy-cloudflare-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
  if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
    echo "→ Watching deploy run $RUN_ID..."
    gh run watch "$RUN_ID" --exit-status || echo "→ Deploy watch finished (check Actions tab if failed)"
  fi
fi

echo "✓ ship-after-build OK $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
