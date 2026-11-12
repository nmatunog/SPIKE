#!/usr/bin/env bash
# SEC-1-only pending-set cases. Does not modify the shared check-pending-migrations.sh
# (byte-identical with v1/versa-pro-monthly-4 @ a54e7f3). Stubbed CLI only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY="$ROOT/scripts/apply-pending-migrations.sh"

fail() {
  echo "check-pending-migrations-sec1: FAIL $*" >&2
  exit 1
}

[[ -f "$APPLY" ]] || fail "missing $APPLY"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/pending-mig-sec1.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/bin" "$TMP/migrations"
STAMP="$TMP/supabase-invoked"
APPLIED_JSON="$TMP/applied.json"
APPLY_LOG="$TMP/apply.log"

cat > "$TMP/bin/supabase" <<EOF
#!/usr/bin/env bash
echo "\$*" >> "$STAMP"
if [[ "\$*" == *schema_migrations* && "\$*" != *insert* ]]; then
  cat "$APPLIED_JSON"
  exit 0
fi
if [[ "\$1" == "db" && "\$2" == "query" && "\$3" == "--linked" && "\$4" == "-f" ]]; then
  echo "APPLY \$(basename "\$5")" >> "$APPLY_LOG"
  exit 0
fi
exit 0
EOF
chmod +x "$TMP/bin/supabase"

seed_sql() {
  local dir="$1"
  shift
  rm -rf "$dir"
  mkdir -p "$dir"
  local name
  for name in "$@"; do
    printf -- '-- stub %s\nselect 1;\n' "$name" > "$dir/${name}.sql"
  done
}

VERSA=(
  20261112080001_versa_csv_code_inventory
  20261112080002_versa_portable_service
  20261112080003_versa_csv_export_schema
  20261112080004_versa_bind_verified_user
  20261112080005_versa_pro_monthly_term
)

# --- full SEC-1 applied, Versa pending: must apply 20261112080001–05 in order ---
cat > "$APPLIED_JSON" <<'JSON'
[
  {"version":"20260827"},
  {"version":"20260829"},
  {"version":"20261112070001"}
]
JSON
seed_sql "$TMP/migrations" \
  20260827_restrict_activation_codes_anon_read \
  20260829_gate_ensure_daily_activation_code \
  20261112070001_intern_signup_rate_limit_atomic \
  "${VERSA[@]}"
: > "$APPLY_LOG"
PATH="$TMP/bin:$PATH" bash "$APPLY" "$TMP/migrations" "test-pending-sec1" >/dev/null \
  || fail "full SEC-1 applied + Versa pending must apply (not out-of-order)"
got="$(awk '{print $2}' "$APPLY_LOG")"
expect="$(printf '%s.sql\n' "${VERSA[@]}")"
[[ "$got" == "$expect" ]] || fail "Versa pending apply order: $got"

# --- old 20261114090001 above Versa: SEC-1-first then Versa must fail loudly ---
cat > "$APPLIED_JSON" <<'JSON'
[
  {"version":"20260827"},
  {"version":"20260829"},
  {"version":"20261114090001"}
]
JSON
seed_sql "$TMP/migrations" \
  20260827_restrict_activation_codes_anon_read \
  20260829_gate_ensure_daily_activation_code \
  20261114090001_intern_signup_rate_limit_atomic \
  "${VERSA[@]}"
: > "$APPLY_LOG"
set +e
ooo_out="$(PATH="$TMP/bin:$PATH" bash "$APPLY" "$TMP/migrations" "test-pending-sec1" 2>&1)"
ooo_rc=$?
set -e
[[ "$ooo_rc" -ne 0 ]] || fail "old 20261114090001 numbering must fail when Versa is pending below it"
echo "$ooo_out" | grep -q 'OUT-OF-ORDER' || fail "old 20261114090001 must say OUT-OF-ORDER: $ooo_out"
echo "$ooo_out" | grep -q '20261112080001_versa_csv_code_inventory.sql' \
  || fail "old 20261114090001 must name pending Versa files: $ooo_out"
echo "$ooo_out" | grep -q '20261112080005_versa_pro_monthly_term.sql' \
  || fail "old 20261114090001 must name 20261112080005: $ooo_out"
echo "$ooo_out" | grep -q 'refusing to skip or auto-apply' \
  || fail "old 20261114090001 must refuse skip/auto-apply: $ooo_out"
if grep -q '^APPLY ' "$APPLY_LOG"; then
  fail "old 20261114090001 must not auto-apply Versa files"
fi

echo "check-pending-migrations-sec1: OK (full SEC-1 then Versa applies; 20261114090001 then Versa fails loudly)"
