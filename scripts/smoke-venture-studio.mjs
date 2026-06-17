#!/usr/bin/env node
/**
 * Smoke test — Day 3 Venture Studio route + storage helpers (no browser).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateVentureStudioStepLocally } from '../src/lib/ventureStudioCoachLocal.js';
import { emptyVentureStudioState } from '../src/lib/ventureStudioStorage.js';

const ROOT = join(import.meta.dirname, '..');

function fail(message) {
  console.error(`smoke:venture-studio FAIL — ${message}`);
  process.exit(1);
}

const pathsJs = readFileSync(join(ROOT, 'src/routes/paths.js'), 'utf8');
if (!pathsJs.includes("playbookVentureStudio: '/playbook/venture-studio/day-3'")) {
  fail('ROUTES.playbookVentureStudio missing');
}
if (!pathsJs.includes('export function isPlaybookPath')) {
  fail('isPlaybookPath helper missing');
}

const portal = readFileSync(join(ROOT, 'src/SpikeMasterPortal.jsx'), 'utf8');
if (!portal.includes('ROUTES.playbookVentureStudio')) {
  fail('SpikeMasterPortal missing venture studio route');
}
if (!portal.includes('isPlaybookPath')) {
  fail('SpikeMasterPortal missing isPlaybookPath onboarding exemption');
}

for (const file of [
  'src/pages/VentureStudioDay3Page.jsx',
  'src/components/playbook/ventureStudio/VentureStudioDay3.jsx',
  'src/components/playbook/ventureStudio/VentureStudioLaunchCard.jsx',
  'src/lib/ventureStudioStorage.js',
]) {
  if (!existsSync(join(ROOT, file))) fail(`missing ${file}`);
}

const sessions = JSON.parse(
  readFileSync(join(ROOT, 'content/segment-1/week-1/day-3/sessions.json'), 'utf8'),
);
const morning = sessions.sessions?.find((s) => s.id === 'session-day-3-morning');
if (!morning) fail('day-3 morning session missing');
if (morning.presentationIds.includes('presentation-day-3-deck-02')) {
  fail('deck-02 should be removed from morning session presentations');
}
if (!morning.activityIds.includes('activity-day-3-persona-workshop')) {
  fail('persona workshop activity missing from morning session');
}

const day3 = JSON.parse(
  readFileSync(join(ROOT, 'content/segment-1/week-1/day-3/day.json'), 'utf8'),
);
if (!day3.interactiveModules?.includes('venture-studio-day-3')) {
  fail('day.json missing interactiveModules venture-studio-day-3');
}

console.log('smoke:venture-studio OK');

const bpoCtx = {
  ...emptyVentureStudioState(),
  targetSegment: 'Young Professionals in BPO',
  step1: {
    description: '',
    stage: 'Early career, living with parents',
    dayInLife: '',
    surprise: '',
  },
};

const richCtx = {
  ...bpoCtx,
  step1: {
    ...bpoCtx.step1,
    dayInLife:
      'After graveyard shift they check GCash first, send half to mother, then pay loan before spending on food.',
    surprise: 'They save in multiple wallets to hide money from family requests.',
  },
};

const sparse = evaluateVentureStudioStepLocally(1, bpoCtx);
const rich = evaluateVentureStudioStepLocally(1, richCtx);
if (sparse.coach === rich.coach) {
  fail('Step 1 coach feedback should differ for sparse vs rich inputs');
}
if (!sparse.coach.includes('BPO') && !sparse.coach.includes('Young Professionals')) {
  fail('Sparse BPO feedback should reference the segment');
}
console.log('smoke:venture-studio coach OK — contextual feedback varies by input');
