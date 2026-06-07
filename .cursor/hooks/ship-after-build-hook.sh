#!/usr/bin/env bash
# Cursor afterShellExecution — ship when npm build completes successfully.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INPUT="$(cat)"

command="$(node -e "const i=JSON.parse(process.argv[1]); console.log(i.command||'')" "$INPUT" 2>/dev/null || true)"
exit_code="$(node -e "const i=JSON.parse(process.argv[1]); console.log(i.exit_code ?? i.exitCode ?? '')" "$INPUT" 2>/dev/null || true)"

if [[ "$exit_code" != "0" ]]; then
  exit 0
fi

if [[ ! "$command" =~ npm\ run\ build|npm\ run\ ship|vite\ build ]]; then
  exit 0
fi

if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  exit 0
fi

"$ROOT/scripts/ship-after-build.sh" || true
exit 0
