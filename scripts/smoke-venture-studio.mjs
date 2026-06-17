#!/usr/bin/env node
/**
 * Smoke test — Day 3 Venture Studio route + storage helpers (no browser).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getVentureStudioCoachFeedback,
  VENTURE_STUDIO_COACH_BY_STEP,
} from '../src/lib/ventureStudioCoachPrompts.js';
import { assessVentureStudioCoachReadiness } from '../src/lib/ventureStudioCoachReadiness.js';
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
  'src/lib/ventureStudioCoachPrompts.js',
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

const baseCtx = {
  ...emptyVentureStudioState(),
  targetSegment: 'Young Professionals in BPO',
};

const step1a = getVentureStudioCoachFeedback(1, baseCtx);
const step1b = getVentureStudioCoachFeedback(1, {
  ...baseCtx,
  step1: { description: 'totally different', stage: 'x', dayInLife: 'y', surprise: 'z' },
});
if (step1a.coach !== step1b.coach || step1a.bias !== step1b.bias) {
  fail('Step 1 coach should be deterministic regardless of other fields');
}
if (!step1a.coach.includes('Young Professionals in BPO')) {
  fail('Step 1 coach should interpolate target segment');
}
if (!step1a.coach.includes('behavioral insight')) {
  fail('Step 1 coach should use the DISCOVER step prompt');
}

const step2 = getVentureStudioCoachFeedback(2, baseCtx);
if (step1a.coach === step2.coach) {
  fail('Each step should have a distinct coach prompt');
}
if (Object.keys(VENTURE_STUDIO_COACH_BY_STEP).length !== 5) {
  fail('Expected five step-specific coach prompts');
}

const emptyReady = assessVentureStudioCoachReadiness(1, emptyVentureStudioState());
if (emptyReady.ready || emptyReady.feedback?.provider !== 'guide') {
  fail('Empty step 1 should block coach with guide feedback');
}
console.log('smoke:venture-studio coach OK — deterministic per-step prompts + readiness gate');
