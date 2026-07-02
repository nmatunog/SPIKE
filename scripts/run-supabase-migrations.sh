#!/usr/bin/env bash
# Apply pending Supabase SQL migrations to the linked remote project.
# Only runs local files with a version newer than the latest recorded in
# supabase_migrations.schema_migrations (safe when older migrations were applied via SQL Editor).
#
# Usage:
#   npm run db:migrate
#   SKIP_DB_MIGRATE=1 npm run ship   # opt out for a single ship

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/supabase/migrations"

if [[ "${SKIP_DB_MIGRATE:-}" == "1" ]]; then
  echo "run-supabase-migrations: skipped (SKIP_DB_MIGRATE=1)"
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "run-supabase-migrations: supabase CLI not found — skip"
  exit 0
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "run-supabase-migrations: no migrations directory"
  exit 0
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "run-supabase-migrations: not logged in to Supabase CLI — skip (run: supabase login)"
  exit 0
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

echo "run-supabase-migrations: remote max version = ${MAX_REMOTE}"

applied=0
shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
IFS=$'\n' files=($(printf '%s\n' "${files[@]}" | sort))
unset IFS

for file in "${files[@]}"; do
  base="$(basename "$file")"
  if [[ ! "$base" =~ ^[0-9]{8}_[a-zA-Z0-9_]+\.sql$ ]]; then
    echo "run-supabase-migrations: skip invalid name $base"
    continue
  fi
  version="${base%%_*}"
  if [[ "$version" > "$MAX_REMOTE" ]]; then
    echo "run-supabase-migrations: applying $base"
    supabase db query --linked -f "$file"
    supabase db query --linked \
      "insert into supabase_migrations.schema_migrations (version) values ('${version}') on conflict do nothing;"
    MAX_REMOTE="$version"
    applied=$((applied + 1))
  fi
done

if [[ "$applied" -gt 0 ]]; then
  supabase db query --linked "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
  echo "run-supabase-migrations: applied ${applied} migration(s)"
else
  echo "run-supabase-migrations: no pending migrations"
fi
