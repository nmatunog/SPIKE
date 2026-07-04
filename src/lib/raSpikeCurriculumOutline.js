/**
 * RA-SPIKE curriculum outline (framework only).
 * Titles/themes are guidelines — not playbook body copy.
 * Participant content lives in content/ra-spike/week-N.json when contentReady.
 */

import { RA_SPIKE_PROGRAM } from './programs/ra-spike.js';
import { getRaSpikeWeekMeta } from './programs/ra-spike-weeks.js';

/** SPIKE weekly flow adapted for RA-SPIKE (reflection is end-of-day). */
export const RA_SPIKE_FRAMEWORK_STEPS = /** @type {const} */ ([
  'learn',
  'workshop',
  'assignment',
  'portfolio',
  'reflection',
]);

/** @type {Record<typeof RA_SPIKE_FRAMEWORK_STEPS[number], string>} */
export const RA_SPIKE_FRAMEWORK_STEP_LABELS = {
  learn: 'Learn',
  workshop: 'Workshop',
  reflection: 'Reflection',
  assignment: 'Assignment',
  portfolio: 'Portfolio',
};

/**
 * Default coach authoring prompts for a week with no published content.
 * @param {number} week
 */
export function buildRaSpikeCoachPromptsForWeek(week) {
  const clamped = Math.max(1, Math.min(RA_SPIKE_PROGRAM.totalWeeks, week));
  const meta = getRaSpikeWeekMeta(clamped);
  const segment = clamped <= 4 ? 'DISCOVER' : 'ADVISE';
  const gate = RA_SPIKE_PROGRAM.stageGates.find((g) => g.week === clamped);

  /** @type {Array<{ id: string, slot: string, prompt: string }>} */
  const prompts = RA_SPIKE_FRAMEWORK_STEPS.map((id) => ({
    id,
    slot: RA_SPIKE_FRAMEWORK_STEP_LABELS[id],
    prompt:
      `Author RA-SPIKE Week ${clamped} ${RA_SPIKE_FRAMEWORK_STEP_LABELS[id]} `
      + `(${meta.theme}). Segment: ${segment}. `
      + 'Use the SPIKE weekly-flow framework with RA-SPIKE-only copy. '
      + 'Do not paste or adapt SPIKE Internship playbook, venture portfolio, or FEC materials.',
  }));

  prompts.push({
    id: 'coach_deck',
    slot: 'Coach deck',
    prompt:
      `Add facilitator deck at content/ra-spike/week-${clamped}/day-1/presentation.json `
      + `(and day.json agenda). RA-SPIKE classroom materials only.`,
  });

  prompts.push({
    id: 'portfolio_artifacts',
    slot: 'Portfolio artifacts',
    prompt:
      `Define Week ${clamped} portfolio artifact fields and review UI in content/ra-spike/week-${clamped}.json `
      + '(portfolioArtifacts). Leave blank for participants until authored.',
  });

  if (gate) {
    prompts.push({
      id: 'stage_gate',
      slot: gate.label,
      prompt:
        `Author ${gate.label} (${gate.title}) prep checklist and evaluation criteria for RA-SPIKE. `
        + 'Do not reuse internship Stage Gate / Demo Day content.',
    });
  }

  return prompts;
}
