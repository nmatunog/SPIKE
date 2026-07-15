#!/usr/bin/env bash
# Sync RA-SPIKE server secrets to Cloudflare Pages (production Functions runtime).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load SETUP_SECRET / RA keys without letting RA-SPIKE local env overwrite internship Supabase.
SETUP_SECRET_VALUE=""
RA_URL="https://yruwfdjqigxxwbqsqhho.supabase.co"
RA_KEY=""
INTERN_URL="https://lzbfjbtjropoaynbcxew.supabase.co"
INTERN_KEY=""

load_kv() {
  local file="$1"
  local key="$2"
  [[ -f "$file" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  printf '%s' "${line#*=}"
}

SETUP_SECRET_VALUE="$(load_kv .env SETUP_SECRET)"
[[ -n "$SETUP_SECRET_VALUE" ]] || SETUP_SECRET_VALUE="$(load_kv .env.ra-spike.local SETUP_SECRET)"
export SETUP_SECRET="$SETUP_SECRET_VALUE"

RA_URL="$(load_kv .env RA_SPIKE_SUPABASE_URL)"
[[ -n "$RA_URL" ]] || RA_URL="$(load_kv .env VITE_RA_SPIKE_SUPABASE_URL)"
[[ -n "$RA_URL" ]] || RA_URL="$(load_kv .env.ra-spike.local RA_SPIKE_SUPABASE_URL)"
[[ -n "$RA_URL" ]] || RA_URL="$(load_kv .env.ra-spike.local VITE_SUPABASE_URL)"
[[ -n "$RA_URL" ]] || RA_URL="https://yruwfdjqigxxwbqsqhho.supabase.co"

RA_KEY="$(load_kv .env RA_SPIKE_SERVICE_ROLE_KEY)"
[[ -n "$RA_KEY" ]] || RA_KEY="$(load_kv .env.ra-spike.local RA_SPIKE_SERVICE_ROLE_KEY)"
[[ -n "$RA_KEY" ]] || RA_KEY="$(load_kv .env.ra-spike.local SUPABASE_SERVICE_ROLE_KEY)"

# Internship keys must come from main .env (never from .env.ra-spike.local).
INTERN_URL="$(load_kv .env VITE_SUPABASE_URL)"
[[ -n "$INTERN_URL" ]] || INTERN_URL="$(load_kv .env SUPABASE_URL)"
[[ -n "$INTERN_URL" ]] || INTERN_URL="https://lzbfjbtjropoaynbcxew.supabase.co"
INTERN_KEY="$(load_kv .env SUPABASE_SERVICE_ROLE_KEY)"

if [[ "$INTERN_URL" == *"yruwfdjqigxxwbqsqhho"* ]]; then
  INTERN_URL="https://lzbfjbtjropoaynbcxew.supabase.co"
fi
if [[ "$RA_URL" == *"lzbfjbtjropoaynbcxew"* ]]; then
  RA_URL="https://yruwfdjqigxxwbqsqhho.supabase.co"
fi

if [[ -z "$RA_KEY" ]] && command -v supabase >/dev/null 2>&1; then
  RA_KEY="$(supabase projects api-keys --project-ref yruwfdjqigxxwbqsqhho -o json 2>/dev/null | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);const k=j.find(x=>x.name==='service_role');process.stdout.write(k?.api_key||'')}catch{}
    })
  " || true)"
fi

if [[ -z "$INTERN_KEY" ]] && command -v supabase >/dev/null 2>&1; then
  INTERN_KEY="$(supabase projects api-keys --project-ref lzbfjbtjropoaynbcxew -o json 2>/dev/null | node -e "
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
  echo "→ ${project} production secrets (server runtime — portal auth hint + staff handoff)"
  put_secret "$project" RA_SPIKE_SUPABASE_URL "$RA_URL"
  put_secret "$project" RA_SPIKE_SERVICE_ROLE_KEY "$RA_KEY"
  if [[ -n "$INTERN_KEY" ]]; then
    put_secret "$project" SUPABASE_URL "$INTERN_URL"
    put_secret "$project" VITE_SUPABASE_URL "$INTERN_URL"
    put_secret "$project" SUPABASE_SERVICE_ROLE_KEY "$INTERN_KEY"
  fi
  if [[ -n "${SETUP_SECRET:-}" ]]; then
    put_secret "$project" SETUP_SECRET "$SETUP_SECRET"
  fi
done

RA_ANON="$(load_kv .env.ra-spike.local VITE_SUPABASE_ANON_KEY)"
[[ -n "$RA_ANON" ]] || RA_ANON="$(load_kv .env VITE_RA_SPIKE_SUPABASE_ANON_KEY)"
[[ -n "$RA_ANON" ]] || RA_ANON="$(load_kv .env RA_SPIKE_SUPABASE_ANON_KEY)"
if [[ -n "$RA_ANON" ]]; then
  for project in spike ra-spike; do
    put_secret "$project" VITE_RA_SPIKE_SUPABASE_ANON_KEY "$RA_ANON"
    put_secret "$project" RA_SPIKE_SUPABASE_ANON_KEY "$RA_ANON"
  done
fi

if [[ -z "${SETUP_SECRET:-}" ]]; then
  echo "⚠ SETUP_SECRET not set in .env / .env.ra-spike.local — staff cross-portal handoff will not work until both Pages projects have the same SETUP_SECRET."
fi

if [[ -z "$INTERN_KEY" ]]; then
  echo "⚠ Internship SUPABASE_SERVICE_ROLE_KEY missing — RA→Internship handoff cannot mint sessions."
fi

echo "setup-cloudflare-pages-ra-spike-secrets OK"
echo "Note: redeploy both Pages projects after changing secrets so Functions pick them up."
echo "  spike:    npx wrangler pages deploy dist --project-name spike --commit-dirty=true"
echo "  ra-spike: npx wrangler pages deploy dist --project-name ra-spike --branch ra-spike --commit-dirty=true"