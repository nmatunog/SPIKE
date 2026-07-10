#!/usr/bin/env bash
# RA-SPIKE Pages build — Vite base /ra-spike/ so dynamic chunks load under portal proxy.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export VITE_APP_BASE=/ra-spike/
# Leave VITE_API_URL unset: on portal.1cma.online, /api/* must hit the main SPIKE Pages
# project (admin, auth, coach). Prefixing /ra-spike routes APIs to ra-spike.pages.dev,
# which breaks superuser admin actions (403 Administrator access required).
unset VITE_API_URL

echo "→ Building RA-SPIKE bundle (base=${VITE_APP_BASE}, api=<portal root /api>)"
SKIP_AUTO_SHIP=1 npm run build

if grep -rq '/ra-spike/api/' dist/assets/*.js 2>/dev/null; then
  echo "ERROR: RA-SPIKE bundle still bakes /ra-spike/api — admin APIs must use /api on portal host"
  exit 1
fi
echo "→ RA-SPIKE API prefix check OK"
