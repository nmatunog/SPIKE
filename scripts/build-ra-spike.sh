#!/usr/bin/env bash
# RA-SPIKE Pages build — Vite base /ra-spike/ so dynamic chunks load under portal proxy.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export VITE_APP_BASE=/ra-spike/
export VITE_API_URL=/ra-spike

echo "→ Building RA-SPIKE bundle (base=${VITE_APP_BASE}, api=${VITE_API_URL})"
SKIP_AUTO_SHIP=1 npm run build
