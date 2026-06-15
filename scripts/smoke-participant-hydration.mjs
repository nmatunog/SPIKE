#!/usr/bin/env node
/**
 * Smoke test — participant hydration module files present (no browser / env).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const required = [
  'src/lib/day1BuilderSync.js',
  'src/lib/participantDataHydration.js',
  'src/lib/supabase/day1BuilderProgress.js',
  'src/hooks/useParticipantHydration.js',
];

for (const rel of required) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`smoke:participant-hydration FAIL — missing ${rel}`);
    process.exit(1);
  }
}

console.log('smoke:participant-hydration OK');
