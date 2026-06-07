#!/usr/bin/env bash
# Verify a Cloudflare API token and store it as CLOUDFLARE_API_TOKEN in GitHub Actions.
#
# Usage:
#   CLOUDFLARE_API_TOKEN=cfat_... ./scripts/set-cloudflare-deploy-token.sh
#   ./scripts/set-cloudflare-deploy-token.sh cfat_...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TOKEN="${CLOUDFLARE_API_TOKEN:-${1:-}}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-66e72ecb625c7e76d017a366156ec53f}"

if [[ -z "$TOKEN" ]]; then
  cat <<'EOF'
Usage:
  CLOUDFLARE_API_TOKEN=cfat_... ./scripts/set-cloudflare-deploy-token.sh
  ./scripts/set-cloudflare-deploy-token.sh cfat_...

Create the token in Cloudflare Dashboard:
  https://dash.cloudflare.com/profile/api-tokens
  Template: Custom token → Account → Cloudflare Pages → Edit
  Or open the prefilled form from README / setup script output.
EOF
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: install GitHub CLI (gh) and run: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: run: gh auth login"
  exit 1
fi

echo "==> Verifying Cloudflare token (Pages access)..."
if ! CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler pages project list --project-name spike >/dev/null 2>&1; then
  echo "Error: token could not list Cloudflare Pages projects."
  echo "  Ensure the token has Account → Cloudflare Pages → Edit for account $ACCOUNT_ID"
  exit 1
fi

echo "==> Storing CLOUDFLARE_API_TOKEN in GitHub Actions secrets..."
gh secret set CLOUDFLARE_API_TOKEN --body "$TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$ACCOUNT_ID"

echo "✓ GitHub secret updated."
echo "  Optional: gh workflow run deploy-cloudflare-pages.yml"
