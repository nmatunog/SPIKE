#!/usr/bin/env bash
# Sync RA-SPIKE server secrets to Cloudflare Pages (production Functions runtime).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

RA_URL="${RA_SPIKE_SUPABASE_URL:-${VITE_RA_SPIKE_SUPABASE_URL:-https://yruwfdjqigxxwbqsqhho.supabase.co}}"
RA_KEY="${RA_SPIKE_SERVICE_ROLE_KEY:-}"

if [[ -z "$RA_KEY" ]] && command -v supabase >/dev/null 2>&1; then
  RA_KEY="$(supabase projects api-keys --project-ref yruwfdjqigxxwbqsqhho -o json 2>/dev/null | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);const k=j.find(x=>x.name==='service_role');process.stdout.write(k?.api_key||'')}catch{}
    })
  " || true)"
fi

if [[ -z "$RA_URL" || -z "$RA_KEY" ]]; then
  echo "setup-cloudflare-pages-ra-spike-secrets: need RA_SPIKE_SUPABASE_URL and RA_SPIKE_SERVICE_ROLE_KEY"
  exit 1
fi

put_secret() {
  local project="$1"
  local name="$2"
  local value="$3"
  printf '%s' "$value" | npx wrangler pages secret put "$name" --project-name "$project" 2>/dev/null
  echo "  ✓ ${project}: ${name}"
}

for project in spike ra-spike; do
  echo "→ ${project} production secrets"
  put_secret "$project" RA_SPIKE_SUPABASE_URL "$RA_URL"
  put_secret "$project" RA_SPIKE_SERVICE_ROLE_KEY "$RA_KEY"
done

echo "setup-cloudflare-pages-ra-spike-secrets OK"
