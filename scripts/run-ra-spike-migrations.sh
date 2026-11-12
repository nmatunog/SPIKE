#!/usr/bin/env bash
# Apply pending RA-SPIKE migrations to the linked Supabase project (must be RA-SPIKE ref).
#
# Pending = local files whose version is not in remote schema_migrations.
# Mixed 8–14 digit versions are compared numerically (right-pad to 14).
#
# Usage:
#   APPLY_DB_MIGRATIONS=1 npm run db:migrate:ra-spike
#   ALLOW_OUT_OF_ORDER=1 APPLY_DB_MIGRATIONS=1 npm run db:migrate:ra-spike

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$ROOT/supabase/ra-spike/migrations}"

# shellcheck disable=SC1091
source "$ROOT/scripts/supabase-projects.sh"

if [[ "${APPLY_DB_MIGRATIONS:-}" != "1" ]]; then
  echo "run-ra-spike-migrations: skipped (set APPLY_DB_MIGRATIONS=1 to apply)"
  exit 0
fi

if [[ "${SKIP_DB_MIGRATE:-}" == "1" ]]; then
  echo "run-ra-spike-migrations: skipped (SKIP_DB_MIGRATE=1)"
  exit 0
fi

bash "$ROOT/scripts/sync-ra-spike-migrations.sh"

if ! command -v supabase >/dev/null 2>&1; then
  echo "run-ra-spike-migrations: supabase CLI not found — skip"
  exit 0
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "run-ra-spike-migrations: not logged in — skip (run: supabase login)"
  exit 0
fi

if [[ "${SKIP_SUPABASE_LINK:-}" != "1" ]]; then
  LINKED="$(cat "$ROOT/supabase/.temp/project-ref" 2>/dev/null || echo '')"
  if [[ "$LINKED" != "$RA_SPIKE_PROJECT_REF" ]]; then
    ensure_supabase_linked "$RA_SPIKE_PROJECT_REF" "RA-SPIKE"
  fi
fi

cd "$ROOT"

bash "$ROOT/scripts/apply-pending-migrations.sh" "$MIGRATIONS_DIR" "run-ra-spike-migrations"
