#!/usr/bin/env bash
# Stubbed-CLI tests for apply-pending-migrations.sh / db:migrate gating.
# Never talks to a real Supabase project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY="$ROOT/scripts/apply-pending-migrations.sh"
RUNNER="$ROOT/scripts/run-supabase-migrations.sh"
RA_RUNNER="$ROOT/scripts/run-ra-spike-migrations.sh"

fail() {
  echo "check-pending-migrations: FAIL $*" >&2
  exit 1
}

[[ -f "$APPLY" ]] || fail "missing $APPLY"
[[ -f "$RUNNER" ]] || fail "missing $RUNNER"
[[ -f "$RA_RUNNER" ]] || fail "missing $RA_RUNNER"

# Source shape: pending is set-membership, not a live-max filter; numeric pad-14.
for src in "$APPLY" "$RUNNER" "$RA_RUNNER"; do
  if grep -E "coalesce\(max\(|max\(version\)|as max_version" "$src" >/dev/null; then
    fail "$(basename "$src") must not query a live max version as the pending predicate"
  fi
done
grep -q 'pad14' "$APPLY" || fail "apply-pending-migrations.sh must pad versions to 14 digits"
grep -q 'ALLOW_OUT_OF_ORDER' "$APPLY" || fail "apply-pending-migrations.sh must honor ALLOW_OUT_OF_ORDER=1"
grep -q 'OUT-OF-ORDER' "$APPLY" || fail "apply-pending-migrations.sh must fail loudly on out-of-order pending files"
grep -q 'APPLY_DB_MIGRATIONS' "$RUNNER" || fail "run-supabase-migrations.sh must gate on APPLY_DB_MIGRATIONS"
grep -q 'APPLY_DB_MIGRATIONS' "$RA_RUNNER" || fail "run-ra-spike-migrations.sh must gate on APPLY_DB_MIGRATIONS"
grep -q 'EXPECTED_PROJECT_REF' "$APPLY" || fail "apply-pending-migrations.sh must assert EXPECTED_PROJECT_REF"
grep -q 'PENDING_MIGRATIONS_TEST_HARNESS' "$APPLY" || fail "apply-pending-migrations.sh must allow PENDING_MIGRATIONS_TEST_HARNESS for stubbed tests"
grep -q 'PENDING_MIGRATIONS_TEST_STUB' "$APPLY" || fail "harness must require PENDING_MIGRATIONS_TEST_STUB on the supabase binary"
grep -q 'CANONICAL_REF_FILE' "$APPLY" || fail "apply-pending-migrations.sh must read the canonical project-ref file"
if grep -q 'LINKED_REF_FILE=' "$APPLY"; then
  fail "LINKED_REF_FILE must not override the linked-ref assert"
fi
if grep -q 'SKIP_SUPABASE_LINK' "$RUNNER" "$RA_RUNNER"; then
  fail "SKIP_SUPABASE_LINK must not remain in production wrappers (test harness only)"
fi
grep -q 'EXPECTED_PROJECT_REF=' "$RUNNER" || fail "run-supabase-migrations.sh must pass EXPECTED_PROJECT_REF"
grep -q 'EXPECTED_PROJECT_REF=' "$RA_RUNNER" || fail "run-ra-spike-migrations.sh must pass EXPECTED_PROJECT_REF"
# Wrappers must check the flag before invoking supabase.
intern_gate="$(awk '/APPLY_DB_MIGRATIONS/{print NR; exit}' "$RUNNER")"
intern_cli="$(awk '/command -v supabase/{print NR; exit}' "$RUNNER")"
[[ -n "$intern_gate" && -n "$intern_cli" && "$intern_gate" -lt "$intern_cli" ]] \
  || fail "run-supabase-migrations.sh must gate APPLY_DB_MIGRATIONS before invoking supabase"
ra_gate="$(awk '/APPLY_DB_MIGRATIONS/{print NR; exit}' "$RA_RUNNER")"
ra_sync="$(awk '/sync-ra-spike-migrations/{print NR; exit}' "$RA_RUNNER")"
[[ -n "$ra_gate" && -n "$ra_sync" && "$ra_gate" -lt "$ra_sync" ]] \
  || fail "run-ra-spike-migrations.sh must gate APPLY_DB_MIGRATIONS before sync/link"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/pending-mig.XXXXXX")"
REF_DIR="$ROOT/supabase/.temp"
REF_FILE="$REF_DIR/project-ref"
REF_BACKUP=""
REF_DIR_CREATED=0
if [[ ! -d "$REF_DIR" ]]; then
  mkdir -p "$REF_DIR"
  REF_DIR_CREATED=1
fi
if [[ -f "$REF_FILE" ]]; then
  REF_BACKUP="$TMP/project-ref.bak"
  cp "$REF_FILE" "$REF_BACKUP"
fi
cleanup() {
  if [[ -n "$REF_BACKUP" && -f "$REF_BACKUP" ]]; then
    mv "$REF_BACKUP" "$REF_FILE"
  else
    rm -f "$REF_FILE"
    if [[ "$REF_DIR_CREATED" == "1" ]]; then
      rmdir "$REF_DIR" 2>/dev/null || true
    fi
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT
write_ref() {
  mkdir -p "$REF_DIR"
  printf '%s\n' "$1" > "$REF_FILE"
}

mkdir -p "$TMP/bin" "$TMP/migrations"
STAMP="$TMP/supabase-invoked"
APPLIED_JSON="$TMP/applied.json"
APPLY_LOG="$TMP/apply.log"

write_stub() {
  cat > "$TMP/bin/supabase" <<EOF
#!/usr/bin/env bash
# PENDING_MIGRATIONS_TEST_STUB
echo "\$*" >> "$STAMP"
if [[ "\$*" == *schema_migrations* && "\$*" != *insert* ]]; then
  cat "$APPLIED_JSON"
  exit 0
fi
if [[ "\$1" == "db" && "\$2" == "query" && "\$3" == "--linked" && "\$4" == "-f" ]]; then
  echo "APPLY \$(basename "\$5")" >> "$APPLY_LOG"
  exit 0
fi
if [[ "\$1" == "projects" ]]; then
  exit 0
fi
if [[ "\$1" == "link" ]]; then
  echo "link-was-called" >> "$STAMP"
  exit 0
fi
exit 0
EOF
  chmod +x "$TMP/bin/supabase"
}

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

run_apply() {
  : > "$STAMP"
  : > "$APPLY_LOG"
  PATH="$TMP/bin:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 bash "$APPLY" "$TMP/migrations" "test-pending" "$@"
}

echo '[]' > "$APPLIED_JSON"
write_stub

# --- SEC-1-first: empty remote, mixed 8-digit SEC-1 + 14-digit Versa ---
seed_sql "$TMP/migrations" \
  20261112080001_versa_csv_code_inventory \
  20260829_gate_ensure_daily_activation_code \
  20260827_restrict_activation_codes_anon_read
out="$(SKIP_APPLY=1 run_apply 2>&1)" || fail "SEC-1-first dry-run exited non-zero: $out"
echo "$out" | grep -q 'would apply 20260827_restrict_activation_codes_anon_read.sql' \
  || fail "SEC-1-first must apply 20260827 first; got: $out"
echo "$out" | grep -q 'would apply 20260829_gate_ensure_daily_activation_code.sql' \
  || fail "SEC-1-first must apply 20260829; got: $out"
echo "$out" | grep -q 'would apply 20261112080001_versa_csv_code_inventory.sql' \
  || fail "SEC-1-first must apply 20261112080001 last; got: $out"
order="$(echo "$out" | grep 'would apply' | sed 's/.*would apply //')"
printf '%s\n' "$order" | awk 'NR==1 && $0 !~ /20260827/ {exit 1}; NR==2 && $0 !~ /20260829/ {exit 1}; NR==3 && $0 !~ /20261112080001/ {exit 1}' \
  || fail "SEC-1-first numeric order wrong: $order"

# Real apply (stub -f) records the same order.
: > "$APPLY_LOG"
PATH="$TMP/bin:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 bash "$APPLY" "$TMP/migrations" "test-pending" >/dev/null
got="$(awk '{print $2}' "$APPLY_LOG")"
expect=$'20260827_restrict_activation_codes_anon_read.sql\n20260829_gate_ensure_daily_activation_code.sql\n20261112080001_versa_csv_code_inventory.sql'
[[ "$got" == "$expect" ]] || fail "SEC-1-first apply order: $got"

# --- Versa-first: 14-digit already applied, 8-digit SEC-1 pending and below max ---
printf '[{"version":"20261112080001"}]\n' > "$APPLIED_JSON"
set +e
ooo_out="$(run_apply 2>&1)"
ooo_rc=$?
set -e
[[ "$ooo_rc" -ne 0 ]] || fail "Versa-first must fail loudly when SEC-1 is pending below remote max"
echo "$ooo_out" | grep -q 'OUT-OF-ORDER' || fail "Versa-first must say OUT-OF-ORDER: $ooo_out"
echo "$ooo_out" | grep -q '20260827_restrict_activation_codes_anon_read.sql' \
  || fail "Versa-first must name 20260827: $ooo_out"
echo "$ooo_out" | grep -q '20260829_gate_ensure_daily_activation_code.sql' \
  || fail "Versa-first must name 20260829: $ooo_out"
echo "$ooo_out" | grep -q 'refusing to skip or auto-apply' \
  || fail "Versa-first must refuse skip/auto-apply: $ooo_out"
if grep -q '^APPLY ' "$APPLY_LOG"; then
  fail "Versa-first must not apply files on the loud fail"
fi

: > "$APPLY_LOG"
PATH="$TMP/bin:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 ALLOW_OUT_OF_ORDER=1 bash "$APPLY" "$TMP/migrations" "test-pending" >/dev/null \
  || fail "Versa-first ALLOW_OUT_OF_ORDER=1 must apply pending SEC-1 files"
got="$(awk '{print $2}' "$APPLY_LOG")"
expect=$'20260827_restrict_activation_codes_anon_read.sql\n20260829_gate_ensure_daily_activation_code.sql'
[[ "$got" == "$expect" ]] || fail "Versa-first ALLOW_OUT_OF_ORDER apply order: $got"

# --- live max 20260829 and a lower unapplied file (the silent-skip case) ---
printf '[{"version":"20260829"}]\n' > "$APPLIED_JSON"
seed_sql "$TMP/migrations" \
  20260827_restrict_activation_codes_anon_read \
  20260829_gate_ensure_daily_activation_code \
  20261112080001_versa_csv_code_inventory
: > "$APPLY_LOG"
set +e
lower_out="$(run_apply 2>&1)"
lower_rc=$?
set -e
[[ "$lower_rc" -ne 0 ]] || fail "live max 20260829 must fail when 20260827 is still pending"
echo "$lower_out" | grep -q '20260827_restrict_activation_codes_anon_read.sql' \
  || fail "live max 20260829 must name the lower pending file: $lower_out"
echo "$lower_out" | grep -qv 'would apply 20260827' \
  || fail "live max 20260829 must not skip-apply the lower file"
if grep -q '20260827' "$APPLY_LOG"; then
  fail "live max 20260829 must not auto-apply 20260827"
fi

# With the flag, apply 20260827 then the higher 14-digit file (20260829 already applied).
: > "$APPLY_LOG"
PATH="$TMP/bin:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 ALLOW_OUT_OF_ORDER=1 bash "$APPLY" "$TMP/migrations" "test-pending" >/dev/null \
  || fail "live max 20260829 ALLOW_OUT_OF_ORDER=1 failed"
got="$(awk '{print $2}' "$APPLY_LOG")"
expect=$'20260827_restrict_activation_codes_anon_read.sql\n20261112080001_versa_csv_code_inventory.sql'
[[ "$got" == "$expect" ]] || fail "live max 20260829 ALLOW_OUT_OF_ORDER order: $got"

# --- 14-digit stamp with an earlier calendar prefix than live 8-digit max ---
printf '[{"version":"20260829"}]\n' > "$APPLIED_JSON"
seed_sql "$TMP/migrations" \
  20251112080001_earlier_calendar_prefix \
  20260829_gate_ensure_daily_activation_code
: > "$APPLY_LOG"
set +e
prefix_out="$(run_apply 2>&1)"
prefix_rc=$?
set -e
[[ "$prefix_rc" -ne 0 ]] || fail "earlier-calendar 14-digit stamp must fail vs live max 20260829"
echo "$prefix_out" | grep -q '20251112080001_earlier_calendar_prefix.sql' \
  || fail "must name the 14-digit earlier-prefix file: $prefix_out"
# Lexicographic trap: unpadded "20251112080001" vs "20260829" also compares as
# less, but padded 20251112080001 < 20260829000000 is the required numeric rule.
if grep -q '^APPLY ' "$APPLY_LOG"; then
  fail "earlier-calendar 14-digit stamp must not be auto-applied"
fi

: > "$APPLY_LOG"
PATH="$TMP/bin:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 ALLOW_OUT_OF_ORDER=1 bash "$APPLY" "$TMP/migrations" "test-pending" >/dev/null \
  || fail "earlier-calendar ALLOW_OUT_OF_ORDER=1 failed"
got="$(awk '{print $2}' "$APPLY_LOG")"
[[ "$got" == "20251112080001_earlier_calendar_prefix.sql" ]] \
  || fail "earlier-calendar ALLOW_OUT_OF_ORDER should apply only the pending 14-digit file: $got"

# --- npm run db:migrate / wrappers must not touch supabase without the flag ---
: > "$STAMP"
PATH="$TMP/bin:$PATH" MIGRATIONS_DIR="$TMP/migrations" bash "$RUNNER" >/dev/null \
  || fail "run-supabase-migrations.sh without APPLY_DB_MIGRATIONS=1 must exit 0"
if [[ -s "$STAMP" ]]; then
  fail "run-supabase-migrations.sh invoked supabase without APPLY_DB_MIGRATIONS=1: $(cat "$STAMP")"
fi

: > "$STAMP"
PATH="$TMP/bin:$PATH" MIGRATIONS_DIR="$TMP/migrations" bash "$RA_RUNNER" >/dev/null \
  || fail "run-ra-spike-migrations.sh without APPLY_DB_MIGRATIONS=1 must exit 0"
if [[ -s "$STAMP" ]]; then
  fail "run-ra-spike-migrations.sh invoked supabase without APPLY_DB_MIGRATIONS=1: $(cat "$STAMP")"
fi

# Gate still holds if someone exports APPLY_DB_MIGRATIONS incorrectly as empty.
: > "$STAMP"
PATH="$TMP/bin:$PATH" APPLY_DB_MIGRATIONS= MIGRATIONS_DIR="$TMP/migrations" bash "$RUNNER" >/dev/null
if [[ -s "$STAMP" ]]; then
  fail "empty APPLY_DB_MIGRATIONS must not invoke supabase"
fi

# --- linked project-ref assert (production path; not the test harness) ---
write_ref 'wrong-ref'
echo '[]' > "$APPLIED_JSON"
seed_sql "$TMP/migrations" 20260827_restrict_activation_codes_anon_read
set +e
link_out="$(
  PATH="$TMP/bin:$PATH" \
    EXPECTED_PROJECT_REF=lzbfjbtjropoaynbcxew \
    SKIP_APPLY=1 \
    bash "$APPLY" "$TMP/migrations" "test-link" 2>&1
)"
link_rc=$?
set -e
[[ "$link_rc" -ne 0 ]] || fail "mismatched linked project-ref must fail"
echo "$link_out" | grep -q "linked project-ref" \
  || fail "mismatch must name linked project-ref: $link_out"

set +e
missing_out="$(
  PATH="$TMP/bin:$PATH" \
    SKIP_APPLY=1 \
    bash "$APPLY" "$TMP/migrations" "test-link" 2>&1
)"
missing_rc=$?
set -e
[[ "$missing_rc" -ne 0 ]] || fail "missing EXPECTED_PROJECT_REF must fail"
echo "$missing_out" | grep -q 'EXPECTED_PROJECT_REF is required' \
  || fail "missing EXPECTED_PROJECT_REF must say so: $missing_out"

write_ref 'lzbfjbtjropoaynbcxew'
match_out="$(
  PATH="$TMP/bin:$PATH" \
    EXPECTED_PROJECT_REF=lzbfjbtjropoaynbcxew \
    SKIP_APPLY=1 \
    bash "$APPLY" "$TMP/migrations" "test-link" 2>&1
)" || fail "matching linked project-ref must proceed: $match_out"
echo "$match_out" | grep -q 'would apply 20260827_restrict_activation_codes_anon_read.sql' \
  || fail "matching linked project-ref should dry-apply: $match_out"

# LINKED_REF_FILE must not override the canonical project-ref outside the harness.
write_ref 'wrong-ref'
printf '%s\n' 'lzbfjbtjropoaynbcxew' > "$TMP/spoof-ref"
set +e
spoof_out="$(
  PATH="$TMP/bin:$PATH" \
    EXPECTED_PROJECT_REF=lzbfjbtjropoaynbcxew \
    LINKED_REF_FILE="$TMP/spoof-ref" \
    SKIP_APPLY=1 \
    bash "$APPLY" "$TMP/migrations" "test-link" 2>&1
)"
spoof_rc=$?
set -e
[[ "$spoof_rc" -ne 0 ]] || fail "LINKED_REF_FILE must not override the canonical project-ref"
echo "$spoof_out" | grep -q "linked project-ref" \
  || fail "spoofed LINKED_REF_FILE must still fail the canonical assert: $spoof_out"

# Harness without the stub marker must refuse before any --linked query.
mkdir -p "$TMP/realish"
cat > "$TMP/realish/supabase" <<EOF
#!/usr/bin/env bash
echo "\$*" >> "$STAMP"
if [[ "\$1" == "db" && "\$2" == "query" && "\$4" == "-f" ]]; then
  echo "APPLY \$(basename "\$5")" >> "$APPLY_LOG"
fi
exit 0
EOF
chmod +x "$TMP/realish/supabase"
: > "$STAMP"
: > "$APPLY_LOG"
set +e
nostub_out="$(
  PATH="$TMP/realish:$PATH" PENDING_MIGRATIONS_TEST_HARNESS=1 \
    bash "$APPLY" "$TMP/migrations" "test-harness" 2>&1
)"
nostub_rc=$?
set -e
[[ "$nostub_rc" -ne 0 ]] || fail "harness without test stub must refuse"
echo "$nostub_out" | grep -q 'PENDING_MIGRATIONS_TEST_STUB' \
  || fail "harness without stub must name the stub marker: $nostub_out"
if [[ -s "$STAMP" ]]; then
  fail "harness without stub must not invoke supabase: $(cat "$STAMP")"
fi
if grep -q '^APPLY ' "$APPLY_LOG"; then
  fail "harness without stub must not apply SQL"
fi

echo "check-pending-migrations: OK (SEC-1-first, Versa-first, live max 20260829 and lower, 14-digit earlier prefix, db:migrate gated, linked-ref assert, harness stub-only)"
