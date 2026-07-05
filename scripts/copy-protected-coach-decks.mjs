#!/usr/bin/env node
/**
 * Copy coach PPTX/PDF into dist/_protected/coach-decks/ for staff-only API delivery.
 * Sources: content source folders and legacy public/content coach deck files.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(root, 'dist', '_protected', 'coach-decks');
const DECK_RE = /^faculty-deck-\d+\.(pptx|pdf|ppt)$/i;

/** @param {string} dir */
function walkCoachDeckSources(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCoachDeckSources(full, out);
      continue;
    }
    if (!DECK_RE.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

/** @param {string} filePath */
function relativeCoachDeckPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const publicMatch = normalized.match(/\/public\/content\/((?:segment-1|ra-spike)\/.+)$/i);
  if (publicMatch) return publicMatch[1];
  const sourceMatch = normalized.match(/\/content\/((?:segment-1|ra-spike)\/.+\/source\/faculty-deck-[^/]+)$/i);
  if (sourceMatch) {
    return sourceMatch[1].replace(/\/source\//, '/');
  }
  return null;
}

const sources = [
  ...walkCoachDeckSources(join(root, 'content')),
  ...walkCoachDeckSources(join(root, 'public', 'content')),
];

let copied = 0;
for (const source of sources) {
  const rel = relativeCoachDeckPath(source);
  if (!rel) continue;
  const dest = join(distRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  const skip = existsSync(dest) && statSync(dest).mtimeMs >= statSync(source).mtimeMs;
  if (skip) continue;
  cpSync(source, dest);
  copied += 1;
}

console.log(`copy-protected-coach-decks OK — ${copied} file(s) in ${distRoot}`);
