#!/usr/bin/env bash
# RA-SPIKE Pages build — Vite base /ra-spike/ so dynamic chunks load under portal proxy.
# Uses the RA-SPIKE Supabase project (separate from SPIKE Internship main).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${VITE_RA_SPIKE_SUPABASE_URL:?RA-SPIKE build requires VITE_RA_SPIKE_SUPABASE_URL (or set in .env)}"
: "${VITE_RA_SPIKE_SUPABASE_ANON_KEY:?RA-SPIKE build requires VITE_RA_SPIKE_SUPABASE_ANON_KEY}"

export VITE_SUPABASE_URL="$VITE_RA_SPIKE_SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$VITE_RA_SPIKE_SUPABASE_ANON_KEY"
export VITE_APP_BASE=/ra-spike/
export VITE_RA_SPIKE_STANDALONE=true
export VITE_RA_SPIKE_API_PREFIX=/ra-spike/api
# Leave VITE_API_URL unset: admin /api/* must hit the main SPIKE Pages project on portal host.
unset VITE_API_URL

echo "→ Building RA-SPIKE bundle (base=${VITE_APP_BASE}, supabase=${VITE_SUPABASE_URL})"
rm -rf dist
SKIP_AUTO_SHIP=1 npm run build

# Cloudflare Pages serves index.html at /. Standalone Vite only emits ra-spike.html; without
# this copy, an old internship index.html can linger and reference missing /ra-spike/assets/* chunks.
cp dist/ra-spike.html dist/index.html
if ! grep -q 'RA-SPIKE' dist/index.html; then
  echo "ERROR: dist/index.html is not the RA-SPIKE shell (expected title from ra-spike.html)"
  exit 1
fi

if grep -rq '/ra-spike/api/admin' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle bakes /ra-spike/api/admin — admin APIs must use /api on portal host"
  exit 1
fi
if ! grep -rq 'VITE_RA_SPIKE_API_PREFIX' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle missing VITE_RA_SPIKE_API_PREFIX (auth APIs must route via /ra-spike/api)"
  exit 1
fi
if ! grep -rq '/ra-spike/signup' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle missing /ra-spike/signup auth route"
  exit 1
fi
if grep -rq 'lzbfjbtjropoaynbcxew' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle still references SPIKE Internship Supabase (lzbfjbtjropoaynbcxew)"
  exit 1
fi
if ! grep -rq 'yruwfdjqigxxwbqsqhho' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle missing RA-SPIKE Supabase project ref (yruwfdjqigxxwbqsqhho)"
  exit 1
fi
if grep -rq 'SpikeMasterPortal' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle still includes SpikeMasterPortal (internship router)"
  exit 1
fi
if ! grep -rq 'VITE_RA_SPIKE_STANDALONE' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle missing standalone app marker (VITE_RA_SPIKE_STANDALONE)"
  exit 1
fi
echo "→ RA-SPIKE API prefix + Supabase project checks OK"
