#!/usr/bin/env node
/**
 * Ensure dist/index.html only references JS/CSS files that exist.
 * Prevents deploys where SPA fallback would serve HTML for missing chunks.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error('verify-dist-assets: dist/index.html missing — run npm run build first');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');
const assetRefs = [
  ...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g),
].map((match) => match[1]);

const missing = assetRefs.filter((ref) => !existsSync(join(dist, ref)));

if (missing.length > 0) {
  console.error('verify-dist-assets: index.html references missing files:');
  for (const ref of missing) {
    console.error(`  - ${ref}`);
  }
  process.exit(1);
}

console.log(`verify-dist-assets OK (${assetRefs.length} assets)`);
