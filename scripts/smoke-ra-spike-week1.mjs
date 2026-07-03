#!/usr/bin/env node
/**
 * Smoke check — RA-SPIKE Week 1 content + step flow metadata.
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
  const mod = await server.ssrLoadModule('/src/lib/raSpikeContentLoader.js');
  const progress = await server.ssrLoadModule('/src/lib/raSpikeWeekProgress.js');

  const week1 = mod.getRaSpikeWeekContent(1);
  if (!week1.steps?.learn?.headline) {
    throw new Error('week-1 learn step missing');
  }
  if (!week1.steps?.assignment?.action?.type) {
    throw new Error('week-1 assignment action missing');
  }
  if (!week1.modules?.includes('dream-board')) {
    throw new Error('week-1 dream-board module missing');
  }

  const steps = mod.listRaSpikeWeekStepIds(1);
  if (steps.length !== 5) {
    throw new Error(`expected 5 steps, got ${steps.length}`);
  }

  const unlocked = progress.isRaSpikeStepUnlocked({ learn: 'complete' }, 'workshop');
  if (!unlocked) throw new Error('sequential unlock failed');

  const deck = mod.getRaSpikeCoachPresentation(1, 1);
  if (!deck?.presentation?.pdfUrl) {
    throw new Error('week-1 day-1 coach presentation missing');
  }
  if (!Array.isArray(deck.slides) || deck.slides.length < 10) {
    throw new Error(`week-1 day-1 expected 10+ slides, got ${deck.slides?.length ?? 0}`);
  }
  const day1 = mod.getRaSpikeDayContent(1, 1);
  if (!day1?.title) throw new Error('week-1 day-1 day.json missing');

  console.log(
    `smoke:ra-spike-week1 OK — "${week1.title}" with ${steps.length} steps, dream-board module, coach deck (${deck.slides.length} slides)`,
  );
} catch (error) {
  console.error('smoke:ra-spike-week1 FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
