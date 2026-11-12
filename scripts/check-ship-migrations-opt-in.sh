#!/usr/bin/env bash
# Prove scripts/ship-after-build.sh never applies DB migrations unless
# APPLY_DB_MIGRATIONS=1 AND the branch is main. Does not talk to Supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SHIP="$ROOT/scripts/ship-after-build.sh"

fail() {
  echo "check-ship-migrations-opt-in: FAIL $*" >&2
  exit 1
}

[[ -f "$SHIP" ]] || fail "missing $SHIP"

node --input-type=module - "$SHIP" <<'EOF'
import { readFileSync } from 'node:fs';

const src = readFileSync(process.argv[2], 'utf8');
const fail = (msg) => {
  console.error(`check-ship-migrations-opt-in: FAIL ${msg}`);
  process.exit(1);
};

const mainCheck = src.search(/BRANCH"\s*!=\s*"main"/);
if (mainCheck < 0) fail('ship-after-build.sh must exit when BRANCH != main');

const intern = src.search(/run-supabase-migrations\.sh/);
const ra = src.search(/run-ra-spike-migrations\.sh/);
if (intern >= 0 && intern < mainCheck) {
  fail('run-supabase-migrations.sh must run after the main-branch check');
}
if (ra >= 0 && ra < mainCheck) {
  fail('run-ra-spike-migrations.sh must run after the main-branch check');
}
if (!/APPLY_DB_MIGRATIONS:-/.test(src) && !/APPLY_DB_MIGRATIONS:=/.test(src)) {
  fail('DB migrations must be gated on APPLY_DB_MIGRATIONS (default off)');
}
if (!/APPLY_DB_MIGRATIONS:-\}/.test(src) && !/\${APPLY_DB_MIGRATIONS:-}/.test(src)) {
  fail('APPLY_DB_MIGRATIONS must default to empty/off');
}
const applyBlock = src.slice(mainCheck);
if (!/APPLY_DB_MIGRATIONS/.test(applyBlock)) {
  fail('APPLY_DB_MIGRATIONS gate must sit after the main-branch check');
}
if (!/== "1"/.test(applyBlock)) {
  fail('migrations must run only when APPLY_DB_MIGRATIONS=1');
}
console.log('check-ship-migrations-opt-in: source shape OK');
EOF

TMP="$(mktemp -d "${TMPDIR:-/tmp}/ship-opt-in.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/bin"
STAMP="$TMP/supabase-invoked"
cat > "$TMP/bin/supabase" <<EOF
#!/bin/sh
echo "\$*" >> "$STAMP"
exit 0
EOF
chmod +x "$TMP/bin/supabase"

# Feature-branch dry run: even with APPLY_DB_MIGRATIONS=1, supabase must not run.
PATH="$TMP/bin:$PATH" APPLY_DB_MIGRATIONS=1 bash "$SHIP" || fail "ship-after-build.sh exited non-zero on a feature branch"
if [[ -f "$STAMP" ]]; then
  fail "supabase CLI was invoked on branch $(git -C "$ROOT" rev-parse --abbrev-ref HEAD) (must never touch a linked project off main)"
fi

# Default off: same, no supabase.
PATH="$TMP/bin:$PATH" bash "$SHIP" || fail "ship-after-build.sh exited non-zero with APPLY_DB_MIGRATIONS unset"
if [[ -f "$STAMP" ]]; then
  fail "supabase CLI was invoked without APPLY_DB_MIGRATIONS=1"
fi

echo "check-ship-migrations-opt-in: OK (opt-in after main-branch check; dry-run did not invoke supabase)"

bash "$ROOT/scripts/check-pending-migrations.sh"
