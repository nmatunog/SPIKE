#!/usr/bin/env node
/** Remove public coach deck binaries from dist and repo public/ (slide PNGs stay). */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK_RE = /^faculty-deck-\d+\.(pptx|pdf|ppt)$/i;

/** @param {string} dir */
function stripCoachDecks(dir) {
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      removed += stripCoachDecks(full);
      continue;
    }
    if (!DECK_RE.test(entry.name)) continue;
    rmSync(full, { force: true });
    removed += 1;
  }
  return removed;
}

const distRemoved = stripCoachDecks(join(root, 'dist', 'content'));
const publicRemoved = stripCoachDecks(join(root, 'public', 'content'));
console.log(`strip-public-coach-decks OK — dist: ${distRemoved}, public: ${publicRemoved}`);
