#!/usr/bin/env bash
# Wire portal.1cma.online → Cloudflare Pages project "spike".
#
# Prerequisites:
#   1. Domain 1cma.online added to the same Cloudflare account (zone active).
#   2. wrangler login OR CLOUDFLARE_API_TOKEN with Pages + DNS edit.
#
# Usage:
#   ./scripts/setup-portal-domain.sh
#   CLOUDFLARE_API_TOKEN=xxx ./scripts/setup-portal-domain.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-66e72ecb625c7e76d017a366156ec53f}"
PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-spike}"
PAGES_SUBDOMAIN="${CLOUDFLARE_PAGES_SUBDOMAIN:-spike-asc.pages.dev}"
APEX_ZONE="${SPIKE_APEX_DOMAIN:-1cma.online}"
PORTAL_HOST="portal.${APEX_ZONE}"

load_cf_token() {
  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    return 0
  fi
  if command -v npx >/dev/null 2>&1; then
    CLOUDFLARE_API_TOKEN="$(npx --yes wrangler@4 auth token --json 2>/dev/null | node -e "
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
  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "==> Using Cloudflare credentials from wrangler login"
  fi
}

cf_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local args=(-sS -X "$method" "https://api.cloudflare.com/client/v4${path}"
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    -H "Content-Type: application/json")
  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  fi
  curl "${args[@]}"
}

require_token() {
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    cat <<'EOF'
Error: set CLOUDFLARE_API_TOKEN or run `npx wrangler login` first.

Create a token: https://dash.cloudflare.com/profile/api-tokens
  → Edit Cloudflare Workers (includes Pages) + Zone DNS Edit for 1cma.online
EOF
    exit 1
  fi
}

load_cf_token
require_token

echo "==> Resolving Cloudflare zone for ${APEX_ZONE}..."
ZONE_JSON="$(cf_api GET "/zones?name=${APEX_ZONE}")"
ZONE_ID="$(node -e "
  const j = JSON.parse(process.argv[1]);
  if (!j.success || !j.result?.length) process.exit(2);
  process.stdout.write(j.result[0].id);
" "$ZONE_JSON" 2>/dev/null || true)"

if [[ -z "${ZONE_ID:-}" ]]; then
  cat <<EOF
Error: zone "${APEX_ZONE}" is not in this Cloudflare account yet.

Add it in the dashboard:
  https://dash.cloudflare.com → Add site → ${APEX_ZONE}
Then point your registrar nameservers to Cloudflare and wait until the zone is Active.
Re-run: ./scripts/setup-portal-domain.sh
EOF
  exit 1
fi

echo "==> Ensuring Pages custom domain ${PORTAL_HOST} on project ${PROJECT_NAME}..."
DOMAINS_JSON="$(cf_api GET "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains")"
HAS_DOMAIN="$(node -e "
  const j = JSON.parse(process.argv[1]);
  const hit = (j.result || []).some((d) => d.name === process.argv[2]);
  process.stdout.write(hit ? 'yes' : 'no');
" "$DOMAINS_JSON" "$PORTAL_HOST")"

if [[ "$HAS_DOMAIN" != "yes" ]]; then
  ADD_JSON="$(cf_api POST "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" "{\"name\":\"${PORTAL_HOST}\"}")"
  node -e "
    const j = JSON.parse(process.argv[1]);
    if (!j.success) {
      console.error('Failed to add Pages domain:', JSON.stringify(j.errors || j, null, 2));
      process.exit(1);
    }
    console.log('  Added', j.result.name, '— status:', j.result.status);
  " "$ADD_JSON"
else
  echo "  Already registered on Pages project."
fi

echo "==> Ensuring proxied CNAME ${PORTAL_HOST} → ${PAGES_SUBDOMAIN}..."
DNS_JSON="$(cf_api GET "/zones/${ZONE_ID}/dns_records?type=CNAME&name=${PORTAL_HOST}")"
HAS_CNAME="$(node -e "
  const j = JSON.parse(process.argv[1]);
  const rec = (j.result || []).find((r) => r.name === process.argv[2]);
  if (!rec) process.stdout.write('no');
  else if (rec.content === process.argv[3] && rec.proxied) process.stdout.write('ok');
  else process.stdout.write('fix');
" "$DNS_JSON" "$PORTAL_HOST" "$PAGES_SUBDOMAIN")"

if [[ "$HAS_CNAME" == "no" ]]; then
  CREATE_JSON="$(cf_api POST "/zones/${ZONE_ID}/dns_records" "{\"type\":\"CNAME\",\"name\":\"portal\",\"content\":\"${PAGES_SUBDOMAIN}\",\"proxied\":true,\"ttl\":1}")"
  node -e "
    const j = JSON.parse(process.argv[1]);
    if (!j.success) {
      console.error('Failed to create CNAME:', JSON.stringify(j.errors || j, null, 2));
      process.exit(1);
    }
    console.log('  Created CNAME portal →', process.argv[2]);
  " "$CREATE_JSON" "$PAGES_SUBDOMAIN"
elif [[ "$HAS_CNAME" == "fix" ]]; then
  RECORD_ID="$(node -e "
    const j = JSON.parse(process.argv[1]);
    const rec = (j.result || []).find((r) => r.name === process.argv[2]);
    if (rec) process.stdout.write(rec.id);
  " "$DNS_JSON" "$PORTAL_HOST")"
  PATCH_JSON="$(cf_api PATCH "/zones/${ZONE_ID}/dns_records/${RECORD_ID}" "{\"type\":\"CNAME\",\"name\":\"portal\",\"content\":\"${PAGES_SUBDOMAIN}\",\"proxied\":true,\"ttl\":1}")"
  node -e "
    const j = JSON.parse(process.argv[1]);
    if (!j.success) {
      console.error('Failed to update CNAME:', JSON.stringify(j.errors || j, null, 2));
      process.exit(1);
    }
    console.log('  Updated CNAME portal →', process.argv[2]);
  " "$PATCH_JSON" "$PAGES_SUBDOMAIN"
else
  echo "  CNAME already correct."
fi

echo ""
echo "✓ SPIKE portal domain setup complete."
echo "  Production: https://${PORTAL_HOST}"
echo "  Staging:    https://${PAGES_SUBDOMAIN}"
echo ""
echo "Next: Supabase → Authentication → URL configuration → add:"
echo "  https://${PORTAL_HOST}/**"
