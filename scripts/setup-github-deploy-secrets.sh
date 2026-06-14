#!/usr/bin/env bash
# One-time setup: GitHub Actions secrets for Cloudflare Pages deploy.
#
# Usage:
#   ./scripts/setup-github-deploy-secrets.sh
#   CLOUDFLARE_API_TOKEN=xxx ./scripts/setup-github-deploy-secrets.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: install GitHub CLI (gh) and run: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: run: gh auth login"
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "==> Configuring GitHub Actions secrets for $REPO"

# Load local .env if present (never commit this file).
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-https://lzbfjbtjropoaynbcxew.supabase.co}"
SUPABASE_ANON="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE="${SUPABASE_SERVICE_ROLE_KEY:-}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-66e72ecb625c7e76d017a366156ec53f}"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [[ -z "$SUPABASE_ANON" ]]; then
  read -r -p "VITE_SUPABASE_ANON_KEY (Supabase anon/publishable key): " SUPABASE_ANON
fi

if [[ -z "$CF_TOKEN" ]] && command -v npx >/dev/null 2>&1; then
  CF_TOKEN="$(npx wrangler auth token --json 2>/dev/null | node -e "
    const fs = require('fs');
    let raw = '';
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(raw);
        if (data.token) process.stdout.write(data.token);
      } catch {}
    });
  " || true)"
  if [[ -n "$CF_TOKEN" ]]; then
    echo "==> Using Cloudflare credentials from local wrangler login"
    echo "    (OAuth tokens expire — create a long-lived API token for production CI)"
  fi
fi

if [[ -z "$CF_TOKEN" ]]; then
  cat <<'EOF'

Create a Cloudflare API token:
  1. https://dash.cloudflare.com/profile/api-tokens
  2. Create Token → Edit Cloudflare Workers (includes Pages deploy)
     OR Custom: Account → Cloudflare Pages → Edit
  3. Copy the token (shown once)

EOF
  read -r -s -p "CLOUDFLARE_API_TOKEN: " CF_TOKEN
  echo
fi

if [[ -z "$SUPABASE_ANON" || -z "$CF_TOKEN" ]]; then
  echo "Error: Supabase anon key and Cloudflare API token are required."
  exit 1
fi

gh secret set VITE_SUPABASE_URL --body "$SUPABASE_URL"
gh secret set VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON"
if [[ -n "$SUPABASE_SERVICE" ]]; then
  gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE"
  echo "✓ SUPABASE_SERVICE_ROLE_KEY set (superuser admin API)."
else
  echo "⚠ Skipped SUPABASE_SERVICE_ROLE_KEY — set in GitHub secrets for superuser user directory API."
fi
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$ACCOUNT_ID"
gh secret set CLOUDFLARE_API_TOKEN --body "$CF_TOKEN"

echo "✓ Secrets set. Push to main or run the workflow manually:"
echo "  gh workflow run deploy-cloudflare-pages.yml"
