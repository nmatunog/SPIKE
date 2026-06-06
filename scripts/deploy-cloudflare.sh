#!/usr/bin/env bash
set -euo pipefail

# One-command deploy helper for Cloudflare Pages auto-deploy via git push.
# - Runs lint + build
# - Stages tracked/untracked changes except ignored paths
# - Creates commit
# - Pushes to origin/main
#
# Usage:
#   ./scripts/deploy-cloudflare.sh "your commit message"
#   ./scripts/deploy-cloudflare.sh --skip-checks "your commit message"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage:
  ./scripts/deploy-cloudflare.sh [--skip-checks] "commit message"

Examples:
  ./scripts/deploy-cloudflare.sh "feat: update dashboard cards"
  ./scripts/deploy-cloudflare.sh --skip-checks "chore: deploy config tweaks"
EOF
  exit 0
fi

SKIP_CHECKS=false
if [[ "${1:-}" == "--skip-checks" ]]; then
  SKIP_CHECKS=true
  shift
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: ./scripts/deploy-cloudflare.sh [--skip-checks] \"commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verifying git branch..."
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: current branch is '$BRANCH'. Switch to 'main' before deploying."
  exit 1
fi

load_build_env() {
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
}

require_production_build_env() {
  if [[ "${VITE_STATIC_ONLY:-false}" == "true" ]]; then
    return 0
  fi
  if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
    echo "Error: production build needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    echo "  - Add them to .env locally, or"
    echo "  - Rely on GitHub Actions (.github/workflows/deploy-cloudflare-pages.yml) after running:"
    echo "      ./scripts/setup-github-deploy-secrets.sh"
    exit 1
  fi
}

if [[ "$SKIP_CHECKS" == "false" ]]; then
  echo "==> Running quality checks (lint + build)..."
  load_build_env
  require_production_build_env
  npm run lint
  npm run build
else
  echo "==> Skipping lint/build checks."
fi

echo "==> Staging files..."
git add -A
git reset -- ".env" "api/.env" 2>/dev/null || true

if git diff --staged --quiet; then
  echo "No staged changes to commit. Nothing to deploy."
  exit 0
fi

echo "==> Creating commit..."
git commit -m "$COMMIT_MESSAGE"

echo "==> Pushing to origin/main (triggers GitHub Actions deploy)..."
git push origin main

echo "Done. Check GitHub → Actions → Deploy to Cloudflare Pages for build status."
echo "      Live site: https://spike-asc.pages.dev"
