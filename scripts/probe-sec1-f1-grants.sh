#!/usr/bin/env bash
# Read-only SEC-1 F1 post-apply probe: actual table/function grants and policies.
# Does not read schema_migrations. Does not apply SQL. Does not log in.
#
# Default: print the probe SQL and exit 0 (safe on any branch).
# To query an already-linked project: PROBE_LINKED=1 bash scripts/probe-sec1-f1-grants.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$ROOT/scripts/probe-sec1-f1-grants.sql"

fail() {
  echo "probe-sec1-f1-grants: FAIL $*" >&2
  exit 1
}

[[ -f "$SQL_FILE" ]] || fail "missing $SQL_FILE"
grep -q 'has_table_privilege' "$SQL_FILE" || fail "probe SQL must check table privileges"
grep -q 'has_function_privilege' "$SQL_FILE" || fail "probe SQL must check function privileges"
grep -q 'activation_codes_public_read' "$SQL_FILE" || fail "probe SQL must look for the public-read policy"
if grep -qi 'schema_migrations' "$SQL_FILE"; then
  fail "probe must not use schema_migrations"
fi

if [[ "${PROBE_LINKED:-}" != "1" ]]; then
  echo "probe-sec1-f1-grants: SQL-only (set PROBE_LINKED=1 to query an already-linked project)"
  cat "$SQL_FILE"
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  fail "supabase CLI not found (PROBE_LINKED=1)"
fi

RAW="$(supabase db query --linked --output json -f "$SQL_FILE")"
echo "$RAW"

node --input-type=module - "$RAW" <<'EOF'
const raw = process.argv[2] || '';
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error('probe-sec1-f1-grants: FAIL could not parse query JSON');
  process.exit(1);
}
const row = parsed?.rows?.[0] || parsed?.[0] || {};
const truthy = (v) => v === true || v === 't' || v === 'true' || v === 1 || v === '1';
const bad = [];
if (truthy(row.anon_select_activation_codes)) bad.push('anon SELECT on activation_codes');
if (truthy(row.anon_execute_ensure)) bad.push('anon EXECUTE on ensure_daily_activation_code()');
if (truthy(row.anon_execute_regenerate)) bad.push('anon EXECUTE on regenerate_daily_activation_code()');
if (truthy(row.public_read_policy_present)) bad.push('policy activation_codes_public_read still present');
if (bad.length) {
  console.error(`probe-sec1-f1-grants: FAIL ${bad.join('; ')}`);
  process.exit(1);
}
console.log('probe-sec1-f1-grants: OK (anon has no SELECT/EXECUTE; public-read policy absent)');
EOF
