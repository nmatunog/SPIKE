#!/usr/bin/env bash
# Reset + bootstrap RA-SPIKE database (schema + migrations). DESTRUCTIVE on RA-SPIKE project only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bash "$ROOT/scripts/ra-spike-supabase-link.sh"

# shellcheck disable=SC1090
source "$ROOT/supabase/ra-spike/project.env"
LINKED_REF="$(cat "$ROOT/supabase/.temp/project-ref" 2>/dev/null || true)"
if [[ "$LINKED_REF" != "$SUPABASE_RA_SPIKE_PROJECT_REF" ]]; then
  echo "ra-spike-db-bootstrap: refuse — CLI must be linked to RA-SPIKE ($SUPABASE_RA_SPIKE_PROJECT_REF)"
  exit 1
fi

cd "$ROOT"

if [[ "${SKIP_RA_SPIKE_DB_RESET:-}" != "1" ]]; then
  echo "ra-spike-db-bootstrap: resetting public schema on RA-SPIKE…"
  supabase db query --linked "
    drop schema if exists supabase_migrations cascade;
    drop schema if exists public cascade;
    create schema public;
    grant all on schema public to postgres;
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all routines in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  "
fi

echo "ra-spike-db-bootstrap: applying base schema…"
supabase db query --linked -f "$ROOT/supabase/schema.sql"
for base in activation_codes.sql password_reset_requests.sql; do
  if [[ -f "$ROOT/supabase/$base" ]]; then
    echo "ra-spike-db-bootstrap: applying $base"
    supabase db query --linked -f "$ROOT/supabase/$base"
  fi
done

chmod +x "$ROOT/scripts/ra-spike-db-migrate.sh"
bash "$ROOT/scripts/ra-spike-db-migrate.sh"

echo "ra-spike-db-bootstrap: done — RA-SPIKE database ready"
