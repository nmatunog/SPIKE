#!/usr/bin/env bash
# Apply local SQL files whose version is NOT in the remote applied-versions list.
# Pending is set-membership, never a comparison against the live maximum. Never compares lexicographically.
#
# Versions are 8–14 digits. Numeric order = right-pad to 14 digits
# (YYYYMMDD → YYYYMMDD000000) so mixed-width stamps stay calendar-ordered.
#
# If any pending file is numerically below the remote max, fail with a non-zero
# exit and list the files. Do not skip them. Do not auto-apply them.
# Set ALLOW_OUT_OF_ORDER=1 to apply those files in numeric order.
#
# Usage:
#   apply-pending-migrations.sh <migrations_dir> [log_prefix]
# Env:
#   ALLOW_OUT_OF_ORDER=1
#   SKIP_APPLY=1          plan / fail-check only (no -f apply)
#   EXPECTED_PROJECT_REF  required unless PENDING_MIGRATIONS_TEST_HARNESS=1
#   PENDING_MIGRATIONS_TEST_HARNESS=1  stubbed-CLI tests only (skip link assert)
#   LINKED_REF_FILE       override path to supabase/.temp/project-ref (tests)

set -euo pipefail

MIGRATIONS_DIR="${1:-}"
LOG_PREFIX="${2:-apply-pending-migrations}"
SCRIPT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LINKED_REF_FILE="${LINKED_REF_FILE:-$SCRIPT_ROOT/supabase/.temp/project-ref}"

if [[ -z "$MIGRATIONS_DIR" || ! -d "$MIGRATIONS_DIR" ]]; then
  echo "${LOG_PREFIX}: missing migrations dir: ${MIGRATIONS_DIR:-<empty>}" >&2
  exit 1
fi

if [[ "${PENDING_MIGRATIONS_TEST_HARNESS:-}" == "1" ]]; then
  : # stubbed CLI tests never talk to a linked project
else
  if [[ -z "${EXPECTED_PROJECT_REF:-}" ]]; then
    echo "${LOG_PREFIX}: EXPECTED_PROJECT_REF is required (linked project must match)" >&2
    exit 1
  fi
  LINKED="$(cat "$LINKED_REF_FILE" 2>/dev/null || echo '')"
  if [[ "$LINKED" != "$EXPECTED_PROJECT_REF" ]]; then
    echo "${LOG_PREFIX}: linked project-ref '${LINKED:-<none>}' != expected '${EXPECTED_PROJECT_REF}'" >&2
    echo "${LOG_PREFIX}: refusing to apply; relink the CLI to the intended project" >&2
    exit 1
  fi
fi

# Right-pad to 14 digits. 20260829 → 20260829000000.
pad14() {
  local v="$1"
  local n=${#v}
  if (( n >= 14 )); then
    printf '%s\n' "$v"
    return
  fi
  printf '%s%0*d\n' "$v" $((14 - n)) 0
}

fetch_applied_versions() {
  local raw
  raw="$(
    supabase db query --linked --output json \
      "select version from supabase_migrations.schema_migrations;"
  )" || {
    echo "${LOG_PREFIX}: failed to list remote schema_migrations versions" >&2
    exit 1
  }
  APPLIED_JSON="$raw" node --input-type=module - <<'EOF'
const raw = process.env.APPLIED_JSON || '';
let parsed;
try {
  parsed = JSON.parse(raw || '[]');
} catch {
  parsed = [];
}
const rows = Array.isArray(parsed)
  ? parsed
  : parsed?.rows || parsed?.data || [];
const versions = [];
for (const row of rows) {
  if (row == null) continue;
  if (typeof row === 'string' || typeof row === 'number') {
    versions.push(String(row));
    continue;
  }
  const v = row.version ?? row.VERSION ?? row.max_version ?? row.maxVersion;
  if (v != null && String(v) !== '') versions.push(String(v));
}
process.stdout.write(versions.join('\n'));
if (versions.length) process.stdout.write('\n');
EOF
}

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)

declare -a LOCAL_VERSIONS=()
declare -a LOCAL_FILES=()
declare -a LOCAL_PADDED=()

for file in "${files[@]}"; do
  base="$(basename "$file")"
  if [[ ! "$base" =~ ^[0-9]{8,14}_[a-zA-Z0-9_]+\.sql$ ]]; then
    echo "${LOG_PREFIX}: skip invalid name $base"
    continue
  fi
  version="${base%%_*}"
  LOCAL_VERSIONS+=("$version")
  LOCAL_FILES+=("$file")
  LOCAL_PADDED+=("$(pad14 "$version")")
done

mapfile -t APPLIED_LIST < <(fetch_applied_versions)

declare -A APPLIED_SET=()
REMOTE_MAX_PAD="00000000000000"
REMOTE_MAX_RAW="0"
for ver in "${APPLIED_LIST[@]}"; do
  [[ -z "$ver" ]] && continue
  APPLIED_SET["$ver"]=1
  padded="$(pad14 "$ver")"
  if [[ "$padded" > "$REMOTE_MAX_PAD" ]]; then
    REMOTE_MAX_PAD="$padded"
    REMOTE_MAX_RAW="$ver"
  fi
done

echo "${LOG_PREFIX}: remote applied versions = ${#APPLIED_SET[@]} (numeric max ${REMOTE_MAX_RAW})"

declare -a PENDING_PADDED=()
declare -a PENDING_FILES=()
declare -a PENDING_VERSIONS=()
declare -a OUT_OF_ORDER=()

if [[ ${#LOCAL_VERSIONS[@]} -eq 0 ]]; then
  echo "${LOG_PREFIX}: no pending migrations"
  exit 0
fi

for i in "${!LOCAL_VERSIONS[@]}"; do
  version="${LOCAL_VERSIONS[$i]}"
  if [[ -n "${APPLIED_SET[$version]:-}" ]]; then
    continue
  fi
  padded="${LOCAL_PADDED[$i]}"
  PENDING_PADDED+=("$padded")
  PENDING_FILES+=("${LOCAL_FILES[$i]}")
  PENDING_VERSIONS+=("$version")
  if [[ "$REMOTE_MAX_RAW" != "0" && "$padded" < "$REMOTE_MAX_PAD" ]]; then
    OUT_OF_ORDER+=("$(basename "${LOCAL_FILES[$i]}")")
  fi
done

if [[ ${#OUT_OF_ORDER[@]} -gt 0 && "${ALLOW_OUT_OF_ORDER:-}" != "1" ]]; then
  echo "${LOG_PREFIX}: OUT-OF-ORDER pending migrations below remote max ${REMOTE_MAX_RAW}:" >&2
  for name in "${OUT_OF_ORDER[@]}"; do
    echo "  $name" >&2
  done
  echo "${LOG_PREFIX}: refusing to skip or auto-apply. Re-run with ALLOW_OUT_OF_ORDER=1 to apply them in numeric order." >&2
  exit 1
fi

if [[ ${#PENDING_FILES[@]} -eq 0 ]]; then
  echo "${LOG_PREFIX}: no pending migrations"
  exit 0
fi

# Numeric order via 14-digit padded keys (equal width → string sort == numeric).
declare -a ORDER=()
for i in "${!PENDING_PADDED[@]}"; do
  ORDER+=("${PENDING_PADDED[$i]}|$i")
done
IFS=$'\n' ORDER=($(printf '%s\n' "${ORDER[@]}" | LC_ALL=C sort))
unset IFS

applied=0
for entry in "${ORDER[@]}"; do
  idx="${entry##*|}"
  file="${PENDING_FILES[$idx]}"
  version="${PENDING_VERSIONS[$idx]}"
  base="$(basename "$file")"
  if [[ "${SKIP_APPLY:-}" == "1" ]]; then
    echo "${LOG_PREFIX}: would apply $base"
    applied=$((applied + 1))
    continue
  fi
  echo "${LOG_PREFIX}: applying $base"
  supabase db query --linked -f "$file"
  supabase db query --linked \
    "insert into supabase_migrations.schema_migrations (version) values ('${version}') on conflict do nothing;"
  applied=$((applied + 1))
done

if [[ "${SKIP_APPLY:-}" == "1" ]]; then
  echo "${LOG_PREFIX}: pending ${applied} migration(s)"
  exit 0
fi

if [[ "$applied" -gt 0 ]]; then
  supabase db query --linked "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
  echo "${LOG_PREFIX}: applied ${applied} migration(s)"
fi
