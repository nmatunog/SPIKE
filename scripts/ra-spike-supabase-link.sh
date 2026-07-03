#!/usr/bin/env bash
# Link local Supabase CLI to the RA-SPIKE project (not SPIKE Internship).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/supabase/ra-spike/project.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ra-spike-supabase-link: missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

REF="${SUPABASE_RA_SPIKE_PROJECT_REF:-}"
if [[ -z "$REF" ]]; then
  echo "ra-spike-supabase-link: SUPABASE_RA_SPIKE_PROJECT_REF not set"
  exit 1
fi

cd "$ROOT"
echo "ra-spike-supabase-link: linking to RA-SPIKE ($REF)…"
supabase link --project-ref "$REF" --yes
echo "ra-spike-supabase-link: OK — CLI is linked to RA-SPIKE"
