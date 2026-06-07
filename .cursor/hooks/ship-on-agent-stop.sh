#!/usr/bin/env bash
# Cursor stop hook — ship after agent completes when there are uncommitted changes.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -t 0 ]; then
  :
else
  cat >/dev/null || true
fi

"$ROOT/scripts/ship-if-dirty.sh" || true
exit 0
