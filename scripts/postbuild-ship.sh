#!/usr/bin/env bash
# npm postbuild hook — ship after local builds only (never in CI).

set -euo pipefail

if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  exit 0
fi

if [[ "${SKIP_AUTO_SHIP:-}" == "1" || "${AUTO_SHIP:-1}" == "0" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/ship-after-build.sh"
