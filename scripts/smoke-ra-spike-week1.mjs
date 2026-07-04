#!/usr/bin/env node
/**
 * Smoke check — RA-SPIKE Week 1 content, blank unpublished weeks, coach prompts.
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
  const portfolio = await server.ssrLoadModule('/src/lib/raSpikeWeek1Portfolio.js');
  const unlock = await server.ssrLoadModule('/src/lib/programUnlockPolicy.js');
  const assignments = await server.ssrLoadModule('/src/lib/programs/ra-spike-assignments.js');
  const home = await server.ssrLoadModule('/src/lib/programs/ra-spike-home.js');
  const gates = await server.ssrLoadModule('/src/lib/raSpikeGateService.js');

  const week1 = mod.getRaSpikeWeekContent(1);
  if (week1.title !== 'Start With You') throw new Error('week-1 title mismatch');
  if (!week1.contentReady) throw new Error('week-1 must be contentReady');
  if (!week1.lessonCards || week1.lessonCards.length !== 4) {
    throw new Error('week-1 needs 4 learn cards (reflection is end-of-day step)');
  }
  for (const id of ['learn', 'workshop', 'assignment', 'portfolio', 'reflection']) {
    if (!week1.steps?.[id]) throw new Error(`week-1 missing step ${id}`);
  }

  const steps = mod.listRaSpikeWeekStepIds(1);
  if (steps.join(',') !== 'learn,workshop,assignment,portfolio,reflection') {
    throw new Error(`week-1 step order wrong: ${steps.join(',')}`);
  }

  // Weeks 2–8: outline only, no invented playbook body or internship assignments.
  for (let w = 2; w <= 8; w += 1) {
    const content = mod.getRaSpikeWeekContent(w);
    if (content.contentReady) throw new Error(`week ${w} must not be contentReady yet`);
    if (mod.listRaSpikeWeekStepIds(w).length) {
      throw new Error(`week ${w} must have no participant steps until authored`);
    }
    if (assignments.getRaSpikeAssignment(w)) {
      throw new Error(`week ${w} must not invent an assignment`);
    }
    const prompts = mod.getRaSpikeWeekCoachPrompts(w);
    if (!prompts.length) throw new Error(`week ${w} needs coach authoring prompts`);
    const joined = prompts.map((p) => p.prompt).join(' ');
    if (!/do not.*internship|internship materials/i.test(joined)) {
      throw new Error(`week ${w} prompts must forbid internship materials`);
    }
  }

  if (gates.getGatePrepChecklist(1).length || gates.getGatePrepChecklist(2).length) {
    throw new Error('stage gate checklists must be empty until week content is authored');
  }

  const status = mod.listRaSpikeCurriculumStatus();
  if (status.filter((s) => s.contentReady).length !== 1) {
    throw new Error('only week 1 should be ready');
  }
  if (status.find((s) => s.week === 2)?.prompts.length < 5) {
    throw new Error('week 2 coach prompts incomplete');
  }

  const empty = portfolio.emptyWeek1Portfolio();
  if (portfolio.canSubmitWeek1Portfolio(empty)) {
    throw new Error('empty portfolio must not be submittable');
  }

  const complete = {
    ...empty,
    lifestyleAnswer: 'Family home by the sea',
    incomePhp: 300000,
    travelAnswer: 'Japan, Italy',
    lifestyleImageUrl: 'data:image/png;base64,aaa',
    incomeImageUrl: 'data:image/png;base64,bbb',
    destinationImageUrl: 'data:image/png;base64,ccc',
    personalVision: 'I choose advising to serve families.',
    blueprintWhy: 'Impact and freedom',
    blueprintGoals: ['Team of 10', 'Own office', 'Travel yearly'],
    blueprintIncomeTarget: '₱300,000',
    blueprintPeopleToImpact: 'Young families in Cebu',
    blueprintCommitment: 'I will finish RA-SPIKE',
    reflectionAnswers: {
      inspired: 'The entrepreneur path',
      fears: 'Rejection',
      excites: 'Building my practice',
    },
    cardsCompleted: {
      welcome: true,
      discover: true,
      dream_builder: true,
      squad: true,
    },
  };
  if (!portfolio.isDreamBuilderComplete(complete)) throw new Error('dream builder should be complete');
  if (!portfolio.isVisionBlueprintComplete(complete)) throw new Error('vision blueprint should be complete');
  if (!portfolio.canSubmitWeek1Portfolio(complete)) throw new Error('complete portfolio should be submittable');
  const withoutSquad = {
    ...complete,
    cardsCompleted: { welcome: true, discover: true, dream_builder: true },
  };
  if (portfolio.canSubmitWeek1Portfolio(withoutSquad)) {
    throw new Error('portfolio must require squad card complete');
  }

  const unlocked = progress.isRaSpikeStepUnlocked({ learn: 'complete' }, 'workshop');
  if (!unlocked) throw new Error('sequential unlock failed');

  if (unlock.isRaSpikeWeekUnlocked(2, { ra_spike_current_week: 1, program_slug: 'ra-spike' })) {
    throw new Error('week 2 must stay locked until faculty publish advances current week');
  }

  const deck = mod.getRaSpikeCoachPresentation(1, 1);
  if (!deck?.presentation?.pdfUrl) {
    throw new Error('week-1 day-1 coach presentation missing');
  }

  const model = home.deriveRaSpikeHomeModel(
    { program_slug: 'ra-spike', ra_spike_current_week: 1, ra_spike_segment: 1 },
    '2026-01-01',
    'mock',
  );
  if (!model.contentReady || !model.assignment) {
    throw new Error('week-1 home must expose authored assignment');
  }
  if (/venture pitch|fec|persona draft/i.test(model.assignment.title + model.assignment.summary)) {
    throw new Error(`week-1 assignment must not use internship language: ${model.assignment.title}`);
  }

  const blankHome = home.deriveRaSpikeHomeModel(
    { program_slug: 'ra-spike', ra_spike_current_week: 4, ra_spike_segment: 1 },
    '2026-01-01',
    'mock',
  );
  if (blankHome.contentReady || blankHome.assignment) {
    throw new Error('week-4 home must stay blank until content is authored');
  }

  console.log(
    'smoke:ra-spike-week1 OK — week 1 ready, weeks 2–8 blank with coach prompts, no internship filler',
  );
} catch (error) {
  console.error('smoke:ra-spike-week1 FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
