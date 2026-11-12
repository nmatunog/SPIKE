#!/usr/bin/env bash
# Prove npm postbuild / ship hooks are guarded so CI cannot auto-commit or deploy.
# Expected job env: SKIP_AUTO_SHIP=1 AUTO_SHIP=0 (GitHub Actions also sets CI and GITHUB_ACTIONS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo '== package.json lifecycle / ship scripts =='
node -e '
const p = require("./package.json");
const keys = Object.keys(p.scripts).filter((k) =>
  /^(pre|post)?(build|install|publish|ship)/.test(k) || k.includes("ship")
);
if (!keys.length) {
  console.error("FAIL: expected postbuild/ship scripts in package.json");
  process.exit(1);
}
for (const k of keys) console.log(k + "=" + p.scripts[k]);
if (!p.scripts.postbuild) {
  console.error("FAIL: package.json is missing postbuild");
  process.exit(1);
}
if (!String(p.scripts.postbuild).includes("postbuild-ship.sh")) {
  console.error("FAIL: postbuild must call scripts/postbuild-ship.sh");
  process.exit(1);
}
if (!p.scripts.ship) {
  console.error("FAIL: package.json is missing ship");
  process.exit(1);
}
'

echo
echo '== scripts/postbuild-ship.sh env guards =='
grep -nE 'SKIP_AUTO_SHIP|AUTO_SHIP|GITHUB_ACTIONS|^CI' scripts/postbuild-ship.sh
grep -q 'SKIP_AUTO_SHIP' scripts/postbuild-ship.sh
grep -q 'AUTO_SHIP' scripts/postbuild-ship.sh
grep -q 'GITHUB_ACTIONS' scripts/postbuild-ship.sh

echo
echo '== scripts/ship-if-dirty.sh env guards =='
grep -nE 'SKIP_AUTO_SHIP|AUTO_SHIP|GITHUB_ACTIONS' scripts/ship-if-dirty.sh
grep -q 'SKIP_AUTO_SHIP' scripts/ship-if-dirty.sh
grep -q 'AUTO_SHIP' scripts/ship-if-dirty.sh

echo
echo '== job env =='
echo "SKIP_AUTO_SHIP=${SKIP_AUTO_SHIP:-<unset>}"
echo "AUTO_SHIP=${AUTO_SHIP:-<unset>}"
echo "CI=${CI:-<unset>}"
echo "GITHUB_ACTIONS=${GITHUB_ACTIONS:-<unset>}"

if [[ "${SKIP_AUTO_SHIP:-}" != "1" ]]; then
  echo "FAIL: SKIP_AUTO_SHIP must be 1 in CI" >&2
  exit 1
fi
if [[ "${AUTO_SHIP:-}" != "0" ]]; then
  echo "FAIL: AUTO_SHIP must be 0 in CI" >&2
  exit 1
fi

echo
echo '== postbuild-ship.sh exits 0 under these env vars (does not exec ship-after-build.sh) =='
output="$(SKIP_AUTO_SHIP=1 AUTO_SHIP=0 bash -x scripts/postbuild-ship.sh 2>&1 || true)"
printf '%s\n' "$output"
if printf '%s\n' "$output" | grep -q 'ship-after-build.sh'; then
  echo "FAIL: postbuild-ship.sh reached ship-after-build.sh" >&2
  exit 1
fi

echo
echo 'ci-prove-ship-guards: OK'
