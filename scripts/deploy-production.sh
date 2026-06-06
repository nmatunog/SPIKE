#!/usr/bin/env bash
# Build with Supabase env and deploy dist to Cloudflare Pages (project: spike).
# Use when GitHub Actions is unavailable or Cloudflare Git webhooks are stale.
#
# Usage:
#   ./scripts/deploy-production.sh
# Requires VITE_SUPABASE_* in .env or environment.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ "${VITE_STATIC_ONLY:-false}" != "true" ]]; then
  if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
    echo "Error: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
    echo "  (Copy from Cloudflare Pages → spike → Settings → Environment variables → Production)"
    exit 1
  fi
fi

echo "==> Lint + build..."
npm run lint
VITE_STATIC_ONLY="${VITE_STATIC_ONLY:-false}" npm run build

echo "==> Deploy to Cloudflare Pages (spike)..."
npx wrangler pages deploy dist --project-name spike --commit-dirty=true

echo "✓ Live: https://spike-asc.pages.dev"
