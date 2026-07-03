#!/usr/bin/env node
/**
 * Smoke check — RA-SPIKE stage gate routing + week 7 assignment week param.
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
  const paths = await server.ssrLoadModule('/src/routes/paths.js');
  const staffGate = await server.ssrLoadModule('/src/lib/raSpikeStaffGateService.js');
  const href = paths.raSpikeStageGateHref(2, 7);
  if (!href.includes('gate=2') || !href.includes('week=7')) {
    throw new Error(`stage gate href wrong: ${href}`);
  }
  const rows = staffGate.buildRaSpikeGateRows([
    {
      id: 'u1',
      name: 'Test Rookie',
      squad: 'Alpha',
      internProgress: {
        program_slug: 'ra-spike',
        ra_spike_current_week: 4,
        gate_1_status: 'pending',
      },
    },
  ]);
  if (rows.length !== 1 || rows[0].gate1 !== 'pending') {
    throw new Error('staff gate rows build failed');
  }
  console.log('smoke:ra-spike-gates OK — week 7 gate-2 prep href + staff gate rows');
} catch (error) {
  console.error('smoke:ra-spike-gates FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
