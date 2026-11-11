#!/usr/bin/env bash
# Prove SEC-1 F1 RA migrations survive sync-ra-spike-migrations.sh.
# Runs the sync script against a TEMP copy of the tree. Never touches hosted DBs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
F1_27="20260827_restrict_activation_codes_anon_read.sql"
F1_29="20260829_gate_ensure_daily_activation_code.sql"
ALLOWLIST="$ROOT/supabase/ra-spike/migrations-allowlist.txt"
INTERN_ROLLBACK29="$ROOT/supabase/migrations/_rollback_20260829_gate_ensure_daily_activation_code.sql"

fail() {
  echo "check-sec1-f1-ra-spike-sync: FAIL $*" >&2
  exit 1
}

grep -qxF "$F1_27" "$ALLOWLIST" || fail "$F1_27 is missing from migrations-allowlist.txt"
grep -qxF "$F1_29" "$ALLOWLIST" || fail "$F1_29 is missing from migrations-allowlist.txt"
if awk 'NF && $1 !~ /^#/ && /rollback/' "$ALLOWLIST" | grep -q .; then
  fail "allowlist must not include rollback files"
fi

[[ -f "$ROOT/supabase/migrations/$F1_27" ]] || fail "intern source missing $F1_27"
[[ -f "$ROOT/supabase/migrations/$F1_29" ]] || fail "intern source missing $F1_29"
[[ -f "$ROOT/supabase/ra-spike/migrations/$F1_27" ]] || fail "RA dest missing $F1_27"
[[ -f "$ROOT/supabase/ra-spike/migrations/$F1_29" ]] || fail "RA dest missing $F1_29"
[[ -f "$ROOT/supabase/ra-spike/rollbacks/$F1_27" ]] || fail "RA rollback missing rollbacks/$F1_27"
[[ -f "$ROOT/supabase/ra-spike/rollbacks/$F1_29" ]] || fail "RA rollback missing rollbacks/$F1_29"
[[ ! -f "$ROOT/supabase/ra-spike/migrations/_rollback_$F1_27" ]] || fail "rollback still under migrations/ (sync would delete it)"
[[ ! -f "$ROOT/supabase/ra-spike/migrations/_rollback_$F1_29" ]] || fail "rollback still under migrations/ (sync would delete it)"

revoke_line="$(grep 'ensure_daily_activation_code' "$INTERN_ROLLBACK29" | grep revoke || true)"
[[ -n "$revoke_line" ]] || fail "intern _rollback_20260829 missing revoke line"
[[ "$revoke_line" == *'from public;'* ]] || fail "intern _rollback_20260829 must revoke from public only (match main)"
[[ "$revoke_line" != *anon* ]] || fail "intern _rollback_20260829 must not revoke from anon"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/sec1-f1-sync.XXXXXX")"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p \
  "$TMP/scripts" \
  "$TMP/supabase/migrations" \
  "$TMP/supabase/ra-spike/migrations" \
  "$TMP/supabase/ra-spike/rollbacks"

cp "$ROOT/scripts/sync-ra-spike-migrations.sh" "$TMP/scripts/"
cp "$ALLOWLIST" "$TMP/supabase/ra-spike/migrations-allowlist.txt"
cp "$ROOT/supabase/migrations/"*.sql "$TMP/supabase/migrations/"
cp "$ROOT/supabase/ra-spike/migrations/"*.sql "$TMP/supabase/ra-spike/migrations/"
cp "$ROOT/supabase/ra-spike/rollbacks/"*.sql "$TMP/supabase/ra-spike/rollbacks/"

# Canaries: extra dest SQL is wiped; rollbacks/ must survive.
echo '-- canary dest file that sync must delete' > "$TMP/supabase/ra-spike/migrations/_should_be_deleted.sql"
echo '-- canary rollback that sync must keep' > "$TMP/supabase/ra-spike/rollbacks/_should_be_kept.sql"
ROLLBACK27_HASH="$(cksum "$TMP/supabase/ra-spike/rollbacks/$F1_27" | awk '{print $1" "$2}')"
ROLLBACK29_HASH="$(cksum "$TMP/supabase/ra-spike/rollbacks/$F1_29" | awk '{print $1" "$2}')"

bash "$TMP/scripts/sync-ra-spike-migrations.sh"

[[ -f "$TMP/supabase/ra-spike/migrations/$F1_27" ]] || fail "temp sync deleted $F1_27"
[[ -f "$TMP/supabase/ra-spike/migrations/$F1_29" ]] || fail "temp sync deleted $F1_29"
[[ ! -f "$TMP/supabase/ra-spike/migrations/_should_be_deleted.sql" ]] || fail "temp sync left dest canary"
[[ -f "$TMP/supabase/ra-spike/rollbacks/_should_be_kept.sql" ]] || fail "temp sync deleted rollbacks/ canary"
[[ -f "$TMP/supabase/ra-spike/rollbacks/$F1_27" ]] || fail "temp sync deleted rollbacks/$F1_27"
[[ -f "$TMP/supabase/ra-spike/rollbacks/$F1_29" ]] || fail "temp sync deleted rollbacks/$F1_29"

AFTER27="$(cksum "$TMP/supabase/ra-spike/rollbacks/$F1_27" | awk '{print $1" "$2}')"
AFTER29="$(cksum "$TMP/supabase/ra-spike/rollbacks/$F1_29" | awk '{print $1" "$2}')"
[[ "$AFTER27" == "$ROLLBACK27_HASH" ]] || fail "temp sync mutated rollbacks/$F1_27"
[[ "$AFTER29" == "$ROLLBACK29_HASH" ]] || fail "temp sync mutated rollbacks/$F1_29"

# Allowlisted copies must come from intern supabase/migrations/.
cmp -s "$TMP/supabase/migrations/$F1_27" "$TMP/supabase/ra-spike/migrations/$F1_27" \
  || fail "temp sync did not copy intern $F1_27 into RA dest"
cmp -s "$TMP/supabase/migrations/$F1_29" "$TMP/supabase/ra-spike/migrations/$F1_29" \
  || fail "temp sync did not copy intern $F1_29 into RA dest"

echo "check-sec1-f1-ra-spike-sync: OK (allowlist + temp sync kept F1 migrations; rollbacks/ untouched)"
