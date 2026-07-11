#!/usr/bin/env bash
# SPIKE Internship and RA-SPIKE use separate Supabase projects — never share or cross-link data.
SPIKE_INTERNSHIP_PROJECT_REF="${SPIKE_INTERNSHIP_PROJECT_REF:-lzbfjbtjropoaynbcxew}"
RA_SPIKE_PROJECT_REF="${RA_SPIKE_PROJECT_REF:-yruwfdjqigxxwbqsqhho}"

# @param {string} expected_ref @param {string} label
ensure_supabase_linked() {
  local expected_ref="$1"
  local label="$2"
  local root="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
  local linked=""

  linked="$(cat "$root/supabase/.temp/project-ref" 2>/dev/null || echo '')"
  if [[ "$linked" != "$expected_ref" ]]; then
    echo "ensure_supabase_linked: linking CLI to ${label} (${expected_ref})…"
    supabase link --project-ref "$expected_ref"
  fi
}
