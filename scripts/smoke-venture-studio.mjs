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
import { assessVentureDesignCoachReadiness, looksLikeInternSelfGoal } from '../src/lib/ventureDesignCoachReadiness.js';
import { isVentureDesignCoachEcho } from '../src/lib/ventureDesignCoachValidation.js';
import { emptyIndividualDraft } from '../src/lib/ventureDesignStudioConstants.js';
import { buildCoachPrompt } from '../shared/coachAi/prompts.js';
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
if (!pathsJs.includes("playbookFecProjection: '/playbook/venture-design/fec-projection'")) {
  fail('ROUTES.playbookFecProjection missing');
}
if (!pathsJs.includes("playbookVentureDesignWorkshop: '/playbook/venture-design/workshop'")) {
  fail('ROUTES.playbookVentureDesignWorkshop missing');
}
if (!pathsJs.includes('export function ventureDesignWorkshopHref')) {
  fail('ventureDesignWorkshopHref helper missing');
}
if (!pathsJs.includes('export function isPlaybookPath')) {
  fail('isPlaybookPath helper missing');
}

const portal = readFileSync(join(ROOT, 'src/SpikeMasterPortal.jsx'), 'utf8');
if (!portal.includes('ROUTES.playbookVentureStudio')) {
  fail('SpikeMasterPortal missing venture studio route');
}
if (!portal.includes('ROUTES.playbookVentureDesignWorkshop')) {
  fail('SpikeMasterPortal missing venture design workshop route');
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
  fail('day-3 deck-02 should be removed from morning session presentations');
}
if (!morning.activityIds.includes('activity-day-3-persona-workshop')) {
  fail('persona workshop activity missing from morning session');
}

const day4Sessions = JSON.parse(
  readFileSync(join(ROOT, 'content/segment-1/week-1/day-4/sessions.json'), 'utf8'),
);
const day4Morning = day4Sessions.sessions?.find((s) => s.id === 'session-day-4-morning');
if (!day4Morning) fail('day-4 morning session missing');
if (day4Morning.presentationIds.includes('presentation-day-4-deck-02')) {
  fail('day-4 deck-02 should be removed from morning session presentations');
}
if (!day4Morning.activityIds.includes('activity-day-4-canvas-workshop')) {
  fail('canvas workshop activity missing from day-4 morning session');
}

for (const file of [
  'src/components/playbook/ventureDesign/VentureDesignLaunchCard.jsx',
  'src/components/playbook/ventureDesign/Day4VentureDesignHero.jsx',
  'src/components/ventureDesign/FecCanvasProjectionView.jsx',
  'src/components/ventureDesign/FecCanvasLayout.jsx',
  'src/lib/fecCanvasLayout.js',
  'src/lib/fecCanvasExemplar.js',
]) {
  if (!existsSync(join(ROOT, file))) fail(`missing ${file}`);
}

const fecLayout = readFileSync(join(ROOT, 'src/lib/fecCanvasLayout.js'), 'utf8');
for (const label of [
  'WHO WE SERVE',
  'PROBLEM WE SOLVE',
  'CLIENT EXPERIENCE',
  'MEASUREMENT DASHBOARD',
  'Primary segments',
  'What gets measured gets managed.',
]) {
  if (!fecLayout.includes(label)) fail(`fecCanvasLayout missing label: ${label}`);
}

const projection = readFileSync(join(ROOT, 'src/components/ventureDesign/FecCanvasProjectionView.jsx'), 'utf8');
if (!projection.includes('FecCanvasLayout')) {
  fail('FecCanvasProjectionView should render FecCanvasLayout');
}
if (!projection.includes('ventureDesignWorkshopHref')) {
  fail('FecCanvasProjectionView should link Open workshop via ventureDesignWorkshopHref');
}

const ventureDesignPage = readFileSync(join(ROOT, 'src/pages/VentureDesignStudio.jsx'), 'utf8');
if (!ventureDesignPage.includes('project') || !ventureDesignPage.includes('FecCanvasProjectionView')) {
  fail('VentureDesignStudio missing FEC projection mode');
}

const hero = readFileSync(join(ROOT, 'src/components/playbook/ventureDesign/Day4VentureDesignHero.jsx'), 'utf8');
if (!hero.includes('playbookFecProjection') || !hero.includes('variant')) {
  fail('Day4VentureDesignHero missing playbook projection link or role variants');
}
if (!hero.includes('ventureDesignWorkshopHref')) {
  fail('Day4VentureDesignHero should use ventureDesignWorkshopHref for staff workshop links');
}

const access = readFileSync(join(ROOT, 'src/lib/fecProjectionAccess.js'), 'utf8');
if (!access.includes('faculty') || !access.includes('mentor')) {
  fail('fecProjectionAccess missing faculty/mentor gate');
}

const exemplar = readFileSync(join(ROOT, 'src/lib/fecCanvasExemplar.js'), 'utf8');
if (/sun\s*life/i.test(exemplar)) {
  fail('fecCanvasExemplar must not reference Sun Life — use AIA Philippines');
}
const uvpDecl = exemplar.match(/export const FEC_CANVAS_EXEMPLAR_UVP[\s\S]*?;/);
if (!uvpDecl?.[0]?.includes('FEC_UVP_SUGGESTIVE_EXAMPLE')) {
  fail('fecCanvasExemplar should derive UVP from FEC_UVP_SUGGESTIVE_EXAMPLE');
}
if (uvpDecl?.[0]?.includes('Healthier, Longer, Better Lives')) {
  fail('fecCanvasExemplar UVP should not use long tagline copy');
}

const facultyView = readFileSync(join(ROOT, 'src/components/playbook/FacultyPlaybookView.jsx'), 'utf8');
if (!facultyView.includes('Day4VentureDesignHero')) {
  fail('FacultyPlaybookView missing Day 4 hero');
}

const sessionView = readFileSync(join(ROOT, 'src/components/playbook/SessionView.jsx'), 'utf8');
if (!sessionView.includes('VentureDesignLaunchCard')) {
  fail('SessionView missing Venture Design Studio launch card');
}
if (!sessionView.includes('presentation-day-4-deck-02')) {
  fail('SessionView missing day-4 deck-02 filter');
}

const day4 = JSON.parse(
  readFileSync(join(ROOT, 'content/segment-1/week-1/day-4/day.json'), 'utf8'),
);
if (!day4.interactiveModules?.includes('venture-design-day-4')) {
  fail('day-4 day.json missing interactiveModules venture-design-day-4');
}

const deck4 = JSON.parse(
  readFileSync(join(ROOT, 'content/segment-1/week-1/day-4/presentation-deck-02.json'), 'utf8'),
);
if (!deck4.presentation?.title?.includes('Venture Design Studio')) {
  fail('day-4 deck-02 should describe Venture Design Studio interactive module');
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

if (
  !looksLikeInternSelfGoal(
    'I want to learn practical skills in finance and understand how to apply them in real-world situations during my internship.',
  )
) {
  fail('looksLikeInternSelfGoal should detect Day 1 internship copy');
}

const internGoalDraft = emptyIndividualDraft();
internGoalDraft.step1.problem =
  'I want to learn practical skills in finance during my internship.';
const blockedDesign = assessVentureDesignCoachReadiness(1, internGoalDraft);
if (blockedDesign.ready || blockedDesign.feedback?.provider !== 'guide') {
  fail('Venture Design coach should block Day 1 personal goals in problem field');
}

const designPrompt = buildCoachPrompt({
  task: 'venture_design_coach',
  stepIndex: 1,
  fields: { programDay: 'Day 4 — Venture Design Studio (FEC)', coachStepTitle: 'Venture Review' },
});
if (!/Day 4 Venture Design/i.test(designPrompt) || /reviewing Day 3 Market Discovery/i.test(designPrompt)) {
  fail('venture_design_coach prompt must scope to Day 4, not Day 3');
}

const echo = 'I want to learn practical skills in finance during my internship.';
if (
  !isVentureDesignCoachEcho(echo, {
    customerProblem: echo,
    targetSegment: 'Young professionals',
  })
) {
  fail('isVentureDesignCoachEcho should reject verbatim internship goal text');
}

const designCoachJs = readFileSync(join(ROOT, 'src/lib/ventureDesignStudioCoach.js'), 'utf8');
if (!designCoachJs.includes('venture_design_coach') || !designCoachJs.includes('assessVentureDesignCoachReadiness')) {
  fail('ventureDesignStudioCoach should use Day 4 task + readiness gate');
}
if (!designCoachJs.includes('acceptVentureDesignCoachResponse')) {
  fail('ventureDesignStudioCoach should validate AI echo before showing coach text');
}

console.log('smoke:venture-studio design coach OK — Day 4 scope + echo guard');
