#!/usr/bin/env bash
# Copy allowlisted SPIKE migrations into supabase/ra-spike/migrations/ for RA-SPIKE-only installs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/supabase/migrations"
DEST="$ROOT/supabase/ra-spike/migrations"
ALLOWLIST="$ROOT/supabase/ra-spike/migrations-allowlist.txt"

mkdir -p "$DEST"
rm -f "$DEST"/*.sql

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
  src_file="$SRC/$line"
  if [[ ! -f "$src_file" ]]; then
    echo "sync-ra-spike-migrations: missing $line (listed in allowlist but not in supabase/migrations/)"
    exit 1
  fi
  cp "$src_file" "$DEST/$line"
done < "$ALLOWLIST"

count="$(find "$DEST" -maxdepth 1 -name '*.sql' | wc -l | tr -d ' ')"
echo "sync-ra-spike-migrations: copied ${count} migration(s) to supabase/ra-spike/migrations/"
