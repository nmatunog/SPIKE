#!/usr/bin/env bash
# Purge Cloudflare cache for portal.1cma.online after deploy (fixes poisoned asset HTML).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZONE_NAME="${PORTAL_ZONE_NAME:-1cma.online}"
HOST="${PORTAL_HOST:-portal.1cma.online}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-66e72ecb625c7e76d017a366156ec53f}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  if command -v npx >/dev/null 2>&1; then
    CLOUDFLARE_API_TOKEN="$(npx wrangler auth token 2>/dev/null || true)"
  fi
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "purge-portal-cache: skip (no CLOUDFLARE_API_TOKEN)"
  exit 0
fi

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  if [[ -n "$data" ]]; then
    curl -fsS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -fsS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

ZONE_ID="$(api GET "/zones?name=${ZONE_NAME}&status=active" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try {
      const j=JSON.parse(d);
      const z=j?.result?.[0]?.id;
      if(!z){ process.exit(1); }
      process.stdout.write(z);
    } catch { process.exit(1); }
  });
" 2>/dev/null || true)"

if [[ -z "$ZONE_ID" ]]; then
  echo "purge-portal-cache: zone ${ZONE_NAME} not found — skipping (new asset hashes still bypass poisoned URLs)"
  exit 0
fi

echo "purge-portal-cache: purging ${HOST} (zone ${ZONE_ID})..."
if ! api POST "/zones/${ZONE_ID}/purge_cache" "{\"hosts\":[\"${HOST}\"]}" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try {
      const j=JSON.parse(d);
      if(!j.success){ console.error(JSON.stringify(j)); process.exit(1); }
      console.log('purge-portal-cache OK');
    } catch (e) {
      console.error('purge-portal-cache: invalid API response');
      process.exit(1);
    }
  });
"; then
  echo "purge-portal-cache: purge failed (token may lack Cache Purge) — new asset hashes still apply"
  exit 0
fi
