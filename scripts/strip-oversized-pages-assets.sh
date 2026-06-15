#!/usr/bin/env bash
# Cloudflare Pages rejects individual files over 25 MiB.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${1:-$ROOT/dist}"
MAX_BYTES=$((25 * 1024 * 1024))

if [[ ! -d "$DIST" ]]; then
  echo "strip-oversized-pages-assets: no dist at $DIST"
  exit 0
fi

while IFS= read -r -d '' file; do
  size="$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")"
  if (( size > MAX_BYTES )); then
    echo "strip-oversized-pages-assets: removing $(du -h "$file" | cut -f1) $file"
    rm -f "$file"
  fi
done < <(find "$DIST" -type f -print0)

echo "strip-oversized-pages-assets OK"
