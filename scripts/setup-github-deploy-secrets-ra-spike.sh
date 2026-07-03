#!/usr/bin/env bash
# One-time setup: GitHub Actions secrets for RA-SPIKE Cloudflare Pages deploy.
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

ENV_FILE="$ROOT/.env.ra-spike.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: missing .env.ra-spike.local"
  echo "Create it from .env.ra-spike.example and add RA-SPIKE Supabase keys first."
  exit 1
fi

# Load local RA-SPIKE env (never commit this file).
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_ANON="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE="${SUPABASE_SERVICE_ROLE_KEY:-}"
ACCOUNT_ID="${RA_SPIKE_CLOUDFLARE_ACCOUNT_ID:-${CLOUDFLARE_ACCOUNT_ID:-66e72ecb625c7e76d017a366156ec53f}}"
CF_TOKEN="${RA_SPIKE_CLOUDFLARE_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
SETUP_SECRET_VALUE="${SETUP_SECRET:-${RA_SPIKE_SETUP_SECRET:-}}"

if [[ -z "$CF_TOKEN" ]] && command -v npx >/dev/null 2>&1; then
  CF_TOKEN="$(npx wrangler auth token --json 2>/dev/null | node -e "
    let raw = '';
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(raw);
        if (data.token) process.stdout.write(data.token);
      } catch {}
    });
  " || true)"
fi

if [[ -z "$SETUP_SECRET_VALUE" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    SETUP_SECRET_VALUE="$(openssl rand -hex 24)"
  else
    SETUP_SECRET_VALUE="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"
  fi
  printf '\nSETUP_SECRET=%s\n' "$SETUP_SECRET_VALUE" >> "$ENV_FILE"
fi

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON" || -z "$SUPABASE_SERVICE" || -z "$CF_TOKEN" ]]; then
  echo "Error: missing one or more required values:"
  echo "  - VITE_SUPABASE_URL"
  echo "  - VITE_SUPABASE_ANON_KEY"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo "  - Cloudflare API token (or local wrangler login)"
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "==> Configuring RA-SPIKE GitHub Actions secrets for $REPO"

gh secret set RA_SPIKE_VITE_SUPABASE_URL --body "$SUPABASE_URL"
gh secret set RA_SPIKE_VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON"
gh secret set RA_SPIKE_SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE"
gh secret set RA_SPIKE_CLOUDFLARE_ACCOUNT_ID --body "$ACCOUNT_ID"
gh secret set RA_SPIKE_CLOUDFLARE_API_TOKEN --body "$CF_TOKEN"
gh secret set RA_SPIKE_SETUP_SECRET --body "$SETUP_SECRET_VALUE"

echo "✓ RA-SPIKE GitHub secrets set."
echo "  Workflow: .github/workflows/deploy-cloudflare-pages-ra-spike.yml"
