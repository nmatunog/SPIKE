#!/usr/bin/env bash
# Commit (if needed) and push dev revisions.
# Manual:  npm run push:dev
# Auto:    Cursor sessionEnd hook (.cursor/hooks/push-on-session-end.sh)
#
# Cloudflare Pages auto-deploys when main is pushed. For lint + build before
# deploy, use: ./scripts/deploy-cloudflare.sh "your message"

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/.cursor/logs"
LOG="$LOG_DIR/auto-push.log"
WITH_CHECKS=false

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage:
  ./scripts/auto-push-dev-revisions.sh [--with-checks]

Options:
  --with-checks   Run npm run lint && npm run build before committing
EOF
  exit 0
fi

if [[ "${1:-}" == "--with-checks" ]]; then
  WITH_CHECKS=true
fi

mkdir -p "$LOG_DIR"
exec >>"$LOG" 2>&1

echo ""
echo "════════════════════════════════════════════════════════"
echo " auto-push-dev-revisions started $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "════════════════════════════════════════════════════════"

cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "→ Not a git repository; skipping"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "→ Branch: $BRANCH"

if [[ "$WITH_CHECKS" == "true" ]]; then
  echo "→ Running lint + build..."
  npm run lint
  npm run build
fi

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "→ Working tree clean; nothing to commit"
else
  echo "→ Staging changes (excluding local secrets and logs)..."
  git add -A
  git reset HEAD -- .env api/.env .cursor/logs 2>/dev/null || true
  git reset HEAD -- .env.local .env.cloud.local 2>/dev/null || true

  if git diff --cached --quiet; then
    echo "→ Nothing to commit after excluding secrets"
  else
    git commit -m "$(cat <<EOF
chore: auto-save dev revisions before session end

Automated commit from Cursor sessionEnd hook ($(date -u +"%Y-%m-%d %H:%M UTC")).
EOF
)"
    echo "→ Committed $(git rev-parse --short HEAD)"
  fi
fi

if ! git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  echo "→ No upstream; setting origin/$BRANCH"
  git push -u origin HEAD
else
  echo "→ Pushing to upstream..."
  git push
fi

echo "✓ auto-push-dev-revisions OK $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
