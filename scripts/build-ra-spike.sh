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
# Leave VITE_API_URL unset: on portal.1cma.online, /api/* must hit the main SPIKE Pages
# project (admin, auth, coach). Prefixing /ra-spike routes APIs to ra-spike.pages.dev,
# which breaks superuser admin actions (403 Administrator access required).
unset VITE_API_URL

echo "→ Building RA-SPIKE bundle (base=${VITE_APP_BASE}, supabase=${VITE_SUPABASE_URL})"
SKIP_AUTO_SHIP=1 npm run build

if grep -rq '/ra-spike/api/' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle still bakes /ra-spike/api — admin APIs must use /api on portal host"
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
echo "→ RA-SPIKE API prefix + Supabase project checks OK"
