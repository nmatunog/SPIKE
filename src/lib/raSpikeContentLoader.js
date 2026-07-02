import { getRaSpikeAssignment } from './programs/ra-spike-assignments.js';
import { getRaSpikeWeekMeta } from './programs/ra-spike-weeks.js';

/** @typedef {'learn' | 'workshop' | 'assignment' | 'reflection' | 'submit'} RaSpikeStepId */

export const RA_SPIKE_STEP_ORDER = /** @type {const} */ ([
  'learn',
  'workshop',
  'assignment',
  'reflection',
  'submit',
]);

const weekModules = import.meta.glob('../../content/ra-spike/week-*.json', {
  eager: true,
  import: 'default',
});

const programModule = import.meta.glob('../../content/ra-spike/program.json', {
  eager: true,
  import: 'default',
});

/** @returns {Record<string, unknown> | null} */
export function getRaSpikeProgramMeta() {
  const entry = Object.values(programModule)[0];
  return entry ?? null;
}

/**
 * @param {number} week
 * @returns {import('./raSpikeContentTypes.js').RaSpikeWeekContent}
 */
export function getRaSpikeWeekContent(week) {
  const clamped = Math.max(1, Math.min(8, week));
  const key = `../../content/ra-spike/week-${clamped}.json`;
  const fromFile = weekModules[key];
  if (fromFile) return /** @type {import('./raSpikeContentTypes.js').RaSpikeWeekContent} */ (fromFile);
  return buildFallbackWeekContent(clamped);
}

/** @param {number} week */
function buildFallbackWeekContent(week) {
  const meta = getRaSpikeWeekMeta(week);
  const assignment = getRaSpikeAssignment(week);
  const isGate = week === 4 || week === 8;

  /** @param {RaSpikeStepId} id @param {string} label */
  function step(id, label, headline, summary) {
    return {
      label,
      headline,
      summary,
      durationMinutes: id === 'assignment' ? assignment.estimatedMinutes : 15,
      bullets: id === 'assignment' ? [assignment.summary] : [summary],
    };
  }

  return {
    weekNumber: week,
    segment: week <= 4 ? 'discover' : 'advise',
    title: meta.theme,
    theme: meta.subtitle,
    modules: [],
    steps: {
      learn: step('learn', 'Learn', meta.theme, `Focus for Week ${week}: ${meta.subtitle}`),
      workshop: step('workshop', 'Workshop', 'Classroom workshop', 'Facilitated cohort activities with your squad.'),
      assignment: {
        ...step('assignment', 'Assignment', assignment.title, assignment.summary),
        action: null,
      },
      reflection: {
        label: 'Reflection',
        headline: 'Weekly reflection',
        summary: 'Capture what you learned this week.',
        durationMinutes: 10,
        prompts: ['What was your biggest insight this week?', 'What will you do differently next week?'],
      },
      submit: {
        label: 'Submit',
        headline: isGate ? 'Stage gate week' : `Mark Week ${week} complete`,
        summary: isGate
          ? 'Complete all steps before your panel evaluation.'
          : 'Confirm all steps are done to unlock the next week.',
        durationMinutes: 2,
        bullets: ['All prior steps must be complete'],
      },
    },
  };
}

/** @param {number} week @param {RaSpikeStepId} stepId */
export function getRaSpikeStepContent(week, stepId) {
  const weekContent = getRaSpikeWeekContent(week);
  return weekContent.steps?.[stepId] ?? null;
}

/** @param {number} week */
export function listRaSpikeWeekStepIds(week) {
  const weekContent = getRaSpikeWeekContent(week);
  return RA_SPIKE_STEP_ORDER.filter((id) => weekContent.steps?.[id]);
}
