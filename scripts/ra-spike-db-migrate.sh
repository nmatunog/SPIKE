#!/usr/bin/env bash
# Apply allowlisted migrations to RA-SPIKE project only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT/supabase/migrations"
ALLOWLIST="$ROOT/supabase/ra-spike/migrations-allowlist.txt"

bash "$ROOT/scripts/ra-spike-supabase-link.sh"

# shellcheck disable=SC1090
source "$ROOT/supabase/ra-spike/project.env"
LINKED_REF="$(cat "$ROOT/supabase/.temp/project-ref" 2>/dev/null || true)"
if [[ "$LINKED_REF" != "$SUPABASE_RA_SPIKE_PROJECT_REF" ]]; then
  echo "ra-spike-db-migrate: CLI not linked to RA-SPIKE"
  exit 1
fi

cd "$ROOT"

supabase db query --linked "
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key
  );
" >/dev/null

migration_applied() {
  local stem="$1"
  supabase db query --linked --output json \
    "select 1 as ok from supabase_migrations.schema_migrations where version = '${stem}' limit 1;" \
    2>/dev/null | node -e "
      let raw = '';
      process.stdin.on('data', (c) => { raw += c; });
      process.stdin.on('end', () => {
        try {
          const rows = JSON.parse(raw)?.rows ?? [];
          process.exit(rows.length > 0 ? 0 : 1);
        } catch { process.exit(1); }
      });
    "
}

applied=0
while IFS= read -r base || [[ -n "$base" ]]; do
  [[ -z "$base" || "$base" =~ ^# ]] && continue
  file="$MIGRATIONS_DIR/$base"
  if [[ ! -f "$file" ]]; then
    echo "ra-spike-db-migrate: missing $base"
    exit 1
  fi
  stem="${base%.sql}"
  if migration_applied "$stem"; then
    continue
  fi
  echo "ra-spike-db-migrate: applying $base"
  supabase db query --linked -f "$file"
  supabase db query --linked \
    "insert into supabase_migrations.schema_migrations (version) values ('${stem}') on conflict do nothing;"
  applied=$((applied + 1))
done < "$ALLOWLIST"

if [[ "$applied" -gt 0 ]]; then
  supabase db query --linked "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
fi
echo "ra-spike-db-migrate: applied ${applied} migration(s)"
