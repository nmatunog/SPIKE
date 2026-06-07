#!/usr/bin/env bash
# Cursor sessionEnd hook — commit and push before the window closes.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Consume hook stdin (sessionEnd payload)
if [ -t 0 ]; then
  :
else
  cat >/dev/null || true
fi

exec "$ROOT/scripts/auto-push-dev-revisions.sh"
