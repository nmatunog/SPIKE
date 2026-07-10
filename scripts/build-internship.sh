#!/usr/bin/env bash
# SPIKE Internship Pages build — root portal at /.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

unset VITE_RA_SPIKE_STANDALONE
unset VITE_RA_SPIKE_API_PREFIX

echo "→ Building SPIKE Internship bundle (base=/)"
npm run build:spike-life
node scripts/build-facilitators-content-reference.mjs
VITE_APP_BASE=/ vite build
node scripts/copy-protected-coach-decks.mjs
node scripts/strip-public-coach-decks.mjs
bash scripts/strip-oversized-pages-assets.sh
node scripts/verify-dist-assets.mjs

if grep -rq 'yruwfdjqigxxwbqsqhho' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: Internship bundle must not reference RA-SPIKE Supabase (yruwfdjqigxxwbqsqhho)"
  exit 1
fi
echo "→ SPIKE Internship build checks OK"
