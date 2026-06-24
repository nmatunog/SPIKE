#!/usr/bin/env node
/**
 * Ensure dist/index.html and bundled JS only reference assets that exist.
 * Prevents deploys where SPA fallback would serve HTML for missing chunks.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const assetsDir = join(dist, 'assets');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error('verify-dist-assets: dist/index.html missing — run npm run build first');
  process.exit(1);
}

/** @param {string} text */
function collectAssetRefs(text) {
  return [...text.matchAll(/\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)/g)].map((match) => match[0]);
}

const html = readFileSync(indexPath, 'utf8');
const assetRefs = new Set(collectAssetRefs(html));

if (existsSync(assetsDir)) {
  for (const file of readdirSync(assetsDir)) {
    if (!file.endsWith('.js')) continue;
    const content = readFileSync(join(assetsDir, file), 'utf8');
    for (const ref of collectAssetRefs(content)) {
      assetRefs.add(ref);
    }
  }
}

const missing = [...assetRefs].filter((ref) => !existsSync(join(dist, ref)));

if (missing.length > 0) {
  console.error('verify-dist-assets: bundle references missing files:');
  for (const ref of missing.sort()) {
    console.error(`  - ${ref}`);
  }
  process.exit(1);
}

console.log(`verify-dist-assets OK (${assetRefs.size} asset refs)`);
