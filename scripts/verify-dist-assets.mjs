#!/usr/bin/env node
/**
 * Ensure dist HTML and bundled JS only reference assets that exist.
 * Prevents deploys where SPA fallback would serve HTML for missing chunks.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const assetsDir = join(dist, 'assets');

/** @param {string} text */
function collectAssetRefs(text) {
  return [...text.matchAll(/\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)/g)].map((match) => match[0]);
}

const htmlFiles = readdirSync(dist).filter((name) => name.endsWith('.html'));
if (htmlFiles.length === 0) {
  console.error('verify-dist-assets: no HTML files in dist — run npm run build first');
  process.exit(1);
}

const assetRefs = new Set();
for (const htmlFile of htmlFiles) {
  const html = readFileSync(join(dist, htmlFile), 'utf8');
  for (const ref of collectAssetRefs(html)) {
    assetRefs.add(ref);
  }
}

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

console.log(`verify-dist-assets OK (${assetRefs.size} asset refs, ${htmlFiles.length} HTML entries)`);
