#!/usr/bin/env bash
# Apply pending RA-SPIKE migrations to the linked Supabase project (must be RA-SPIKE ref).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/supabase/ra-spike/migrations"

# shellcheck disable=SC1091
source "$ROOT/scripts/supabase-projects.sh"

bash "$ROOT/scripts/sync-ra-spike-migrations.sh"

if [[ "${SKIP_DB_MIGRATE:-}" == "1" ]]; then
  echo "run-ra-spike-migrations: skipped (SKIP_DB_MIGRATE=1)"
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "run-ra-spike-migrations: supabase CLI not found — skip"
  exit 0
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "run-ra-spike-migrations: not logged in — skip (run: supabase login)"
  exit 0
fi

LINKED="$(cat "$ROOT/supabase/.temp/project-ref" 2>/dev/null || echo '')"
if [[ "$LINKED" != "$RA_SPIKE_PROJECT_REF" ]]; then
  ensure_supabase_linked "$RA_SPIKE_PROJECT_REF" "RA-SPIKE"
fi

cd "$ROOT"

MAX_REMOTE="$(
  supabase db query --linked --output json \
    "select coalesce(max(version), '0') as max_version from supabase_migrations.schema_migrations;" \
    2>/dev/null | node -e "
      let raw = '';
      process.stdin.on('data', (c) => { raw += c; });
      process.stdin.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const row = parsed?.rows?.[0];
          process.stdout.write(String(row?.max_version ?? row?.maxVersion ?? '0'));
        } catch {
          process.stdout.write('0');
        }
      });
    " 2>/dev/null || echo "0"
)"

echo "run-ra-spike-migrations: remote max version = ${MAX_REMOTE}"

applied=0
shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
IFS=$'\n' files=($(printf '%s\n' "${files[@]}" | sort))
unset IFS

for file in "${files[@]}"; do
  base="$(basename "$file")"
  if [[ ! "$base" =~ ^[0-9]{8}_[a-zA-Z0-9_]+\.sql$ ]]; then
    continue
  fi
  version="${base%%_*}"
  if [[ "$version" > "$MAX_REMOTE" ]]; then
    echo "run-ra-spike-migrations: applying $base"
    supabase db query --linked -f "$file"
    supabase db query --linked \
      "insert into supabase_migrations.schema_migrations (version) values ('${version}') on conflict do nothing;"
    MAX_REMOTE="$version"
    applied=$((applied + 1))
  fi
done

if [[ "$applied" -gt 0 ]]; then
  supabase db query --linked "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
  echo "run-ra-spike-migrations: applied ${applied} migration(s)"
else
  echo "run-ra-spike-migrations: no pending migrations"
fi
