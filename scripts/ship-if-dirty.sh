#!/usr/bin/env bash
# Lint, build, commit, and push when the working tree has changes (local only).
#
# Usage:
#   ./scripts/ship-if-dirty.sh
#   SKIP_AUTO_SHIP=1 ./scripts/ship-if-dirty.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  exit 0
fi

if [[ "${SKIP_AUTO_SHIP:-}" == "1" || "${AUTO_SHIP:-1}" == "0" ]]; then
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

npm run ship
