#!/usr/bin/env node
/**
 * Smoke check — RA-SPIKE Week 1 content, portfolio helpers, unlock policy.
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

  const week1 = mod.getRaSpikeWeekContent(1);
  if (week1.title !== 'Start With You') throw new Error('week-1 title mismatch');
  if (!week1.lessonCards || week1.lessonCards.length !== 5) {
    throw new Error('week-1 needs 5 lesson cards');
  }
  for (const id of ['learn', 'workshop', 'reflection', 'assignment', 'portfolio']) {
    if (!week1.steps?.[id]) throw new Error(`week-1 missing step ${id}`);
  }

  const steps = mod.listRaSpikeWeekStepIds(1);
  if (!steps.includes('portfolio') || steps.includes('submit')) {
    throw new Error(`week-1 steps should use portfolio not submit: ${steps.join(',')}`);
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
      reflection: true,
    },
  };
  if (!portfolio.isDreamBuilderComplete(complete)) throw new Error('dream builder should be complete');
  if (!portfolio.isVisionBlueprintComplete(complete)) throw new Error('vision blueprint should be complete');
  if (!portfolio.canSubmitWeek1Portfolio(complete)) throw new Error('complete portfolio should be submittable');

  const unlocked = progress.isRaSpikeStepUnlocked({ learn: 'complete' }, 'workshop');
  if (!unlocked) throw new Error('sequential unlock failed');

  // Week 2 stays locked at current_week 1 (faculty publish required).
  if (unlock.isRaSpikeWeekUnlocked(2, { ra_spike_current_week: 1, program_slug: 'ra-spike' })) {
    throw new Error('week 2 must stay locked until faculty publish advances current week');
  }
  if (!unlock.isRaSpikeWeekUnlocked(2, { ra_spike_current_week: 2, program_slug: 'ra-spike' })) {
    throw new Error('week 2 should unlock when current week is 2');
  }

  const deck = mod.getRaSpikeCoachPresentation(1, 1);
  if (!deck?.presentation?.pdfUrl) {
    throw new Error('week-1 day-1 coach presentation missing');
  }

  console.log(
    `smoke:ra-spike-week1 OK — "${week1.title}", ${steps.length} steps, portfolio gate, faculty unlock`,
  );
} catch (error) {
  console.error('smoke:ra-spike-week1 FAIL —', error.message);
  process.exitCode = 1;
} finally {
  await server.close();
}
