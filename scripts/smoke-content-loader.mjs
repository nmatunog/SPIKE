#!/usr/bin/env node
/**
 * Vite SSR smoke check — verifies contentLoader glob resolves Day 1 bundle.
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const server = await createServer({
  root,
  server: { middlewareMode: true },
  logLevel: 'error',
});

try {
  const mod = await server.ssrLoadModule('/src/lib/curriculumService.js');
  const segments = mod.listSegments();
  if (segments.length === 0) {
    throw new Error('no segments loaded');
  }
  const bundle = mod.assertSegment1Week1Day1Ready();
  console.log(
    `smoke:content:loader OK — Day 1 "${bundle.day.title}" with ${bundle.presentation.slides.length} slides`,
  );
} catch (error) {
  console.error('smoke:content:loader FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
