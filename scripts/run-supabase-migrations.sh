#!/usr/bin/env bash
# Apply pending Supabase SQL migrations to the linked remote project.
#
# Pending = local files whose version is not in remote schema_migrations.
# Mixed 8–14 digit versions are compared numerically (right-pad to 14).
#
# Usage:
#   APPLY_DB_MIGRATIONS=1 npm run db:migrate
#   ALLOW_OUT_OF_ORDER=1 APPLY_DB_MIGRATIONS=1 npm run db:migrate

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$ROOT/supabase/migrations}"

# shellcheck disable=SC1091
source "$ROOT/scripts/supabase-projects.sh"

if [[ "${APPLY_DB_MIGRATIONS:-}" != "1" ]]; then
  echo "run-supabase-migrations: skipped (set APPLY_DB_MIGRATIONS=1 to apply)"
  exit 0
fi

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

ensure_supabase_linked "$SPIKE_INTERNSHIP_PROJECT_REF" "SPIKE Internship"

EXPECTED_PROJECT_REF="$SPIKE_INTERNSHIP_PROJECT_REF" \
  bash "$ROOT/scripts/apply-pending-migrations.sh" "$MIGRATIONS_DIR" "run-supabase-migrations"
