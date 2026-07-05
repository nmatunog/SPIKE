#!/usr/bin/env node
/** Rewrite legacy /content/.../faculty-deck-* URLs to staff-only API paths in presentation JSON. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} url */
function toApiUrl(url) {
  if (typeof url !== 'string') return url;
  const match = url.match(/^\/content\/((?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt))$/i);
  if (!match) return url;
  return `/api/coach/faculty-deck/${match[1]}`;
}

/** @param {string} dir @param {string[]} out */
function walkJsonFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(full, out);
      continue;
    }
    if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = walkJsonFiles(join(root, 'content'));
let updated = 0;

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  let changed = false;

  if (data.presentation?.pptxUrl) {
    const next = toApiUrl(data.presentation.pptxUrl);
    if (next !== data.presentation.pptxUrl) {
      data.presentation.pptxUrl = next;
      changed = true;
    }
  }
  if (data.presentation?.pdfUrl) {
    const next = toApiUrl(data.presentation.pdfUrl);
    if (next !== data.presentation.pdfUrl) {
      data.presentation.pdfUrl = next;
      changed = true;
    }
  }

  if (!changed) continue;
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  updated += 1;
}

console.log(`migrate-faculty-deck-urls OK — ${updated} presentation file(s) updated`);
