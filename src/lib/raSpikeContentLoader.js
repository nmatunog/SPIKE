import { buildRaSpikeCoachPromptsForWeek, RA_SPIKE_FRAMEWORK_STEPS } from './raSpikeCurriculumOutline.js';
import { getRaSpikeWeekMeta } from './programs/ra-spike-weeks.js';

/** @typedef {'learn' | 'workshop' | 'assignment' | 'reflection' | 'portfolio' | 'submit'} RaSpikeStepId */

/** Participant step order when a week is contentReady. */
export const RA_SPIKE_STEP_ORDER = /** @type {const} */ ([
  'learn',
  'workshop',
  'reflection',
  'assignment',
  'portfolio',
]);

const weekModules = import.meta.glob('../../content/ra-spike/week-*.json', {
  eager: true,
  import: 'default',
});

const programModule = import.meta.glob('../../content/ra-spike/program.json', {
  eager: true,
  import: 'default',
});

const presentationModules = import.meta.glob(
  '../../content/ra-spike/week-*/day-*/presentation*.json',
  {
    eager: true,
    import: 'default',
  },
);

const dayModules = import.meta.glob('../../content/ra-spike/week-*/day-*/day.json', {
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
  if (fromFile) {
    return normalizeWeekContent(clamped, /** @type {import('./raSpikeContentTypes.js').RaSpikeWeekContent} */ (fromFile));
  }
  return buildOutlineOnlyWeek(clamped);
}

/**
 * @param {number} week
 * @param {import('./raSpikeContentTypes.js').RaSpikeWeekContent} raw
 */
function normalizeWeekContent(week, raw) {
  const meta = getRaSpikeWeekMeta(week);
  const contentReady = raw.contentReady === true;
  const steps = contentReady && raw.steps && typeof raw.steps === 'object' ? raw.steps : {};
  return {
    ...raw,
    weekNumber: week,
    segment: raw.segment ?? (week <= 4 ? 'discover' : 'advise'),
    title: raw.title || meta.theme,
    theme: raw.theme || meta.subtitle,
    contentReady,
    modules: Array.isArray(raw.modules) ? raw.modules : [],
    portfolioArtifacts: Array.isArray(raw.portfolioArtifacts) ? raw.portfolioArtifacts : [],
    coachPrompts: Array.isArray(raw.coachPrompts) ? raw.coachPrompts : undefined,
    steps,
  };
}

/** Outline only — never invent playbook body. */
function buildOutlineOnlyWeek(week) {
  const meta = getRaSpikeWeekMeta(week);
  return {
    weekNumber: week,
    segment: week <= 4 ? 'discover' : 'advise',
    title: meta.theme,
    theme: meta.subtitle,
    contentReady: false,
    modules: [],
    portfolioArtifacts: [],
    steps: {},
  };
}

/** @param {number} week */
export function isRaSpikeWeekContentReady(week) {
  return getRaSpikeWeekContent(week).contentReady === true;
}

/**
 * Coach authoring prompts for missing curriculum slots.
 * @param {number} week
 * @returns {import('./raSpikeContentTypes.js').RaSpikeCoachPrompt[]}
 */
export function getRaSpikeWeekCoachPrompts(week) {
  const content = getRaSpikeWeekContent(week);
  if (Array.isArray(content.coachPrompts) && content.coachPrompts.length) {
    return content.coachPrompts;
  }
  if (content.contentReady) {
    const missing = [];
    for (const id of RA_SPIKE_FRAMEWORK_STEPS) {
      if (!content.steps?.[id]) {
        missing.push({
          id,
          slot: id,
          prompt: `Week ${week} is marked ready but step "${id}" is empty — author it in content/ra-spike/week-${week}.json.`,
        });
      }
    }
    if (!getRaSpikeCoachPresentation(week, 1)) {
      missing.push({
        id: 'coach_deck',
        slot: 'Coach deck',
        prompt: `Add facilitator deck at content/ra-spike/week-${week}/day-1/presentation.json.`,
      });
    }
    return missing;
  }
  return buildRaSpikeCoachPromptsForWeek(week);
}

/** @param {number} week @param {RaSpikeStepId} stepId */
export function getRaSpikeStepContent(week, stepId) {
  if (!isRaSpikeWeekContentReady(week)) return null;
  const weekContent = getRaSpikeWeekContent(week);
  return weekContent.steps?.[stepId] ?? null;
}

/** @param {number} week */
export function listRaSpikeWeekStepIds(week) {
  if (!isRaSpikeWeekContentReady(week)) return [];
  const weekContent = getRaSpikeWeekContent(week);
  return RA_SPIKE_STEP_ORDER.filter((id) => weekContent.steps?.[id]);
}

/**
 * Portfolio artifact definitions for a week (empty when not authored).
 * @param {number} week
 */
export function listRaSpikePortfolioArtifacts(week) {
  const content = getRaSpikeWeekContent(week);
  if (!content.contentReady) return [];
  return content.portfolioArtifacts ?? [];
}

/**
 * Curriculum status for coach authoring UI.
 * @returns {Array<{
 *   week: number,
 *   title: string,
 *   theme: string,
 *   segment: string,
 *   contentReady: boolean,
 *   stepCount: number,
 *   artifactCount: number,
 *   hasCoachDeck: boolean,
 *   prompts: import('./raSpikeContentTypes.js').RaSpikeCoachPrompt[],
 * }>}
 */
export function listRaSpikeCurriculumStatus() {
  return Array.from({ length: 8 }, (_, i) => {
    const week = i + 1;
    const content = getRaSpikeWeekContent(week);
    return {
      week,
      title: content.title,
      theme: content.theme,
      segment: content.segment,
      contentReady: content.contentReady === true,
      stepCount: listRaSpikeWeekStepIds(week).length,
      artifactCount: listRaSpikePortfolioArtifacts(week).length,
      hasCoachDeck: Boolean(getRaSpikeCoachPresentation(week, 1)),
      prompts: getRaSpikeWeekCoachPrompts(week),
    };
  });
}

/**
 * @param {number} week
 * @param {number} [day=1]
 * @returns {{ id: string, title: string, theme?: string, agenda?: object[], objectives?: string[], summary?: string } | null}
 */
export function getRaSpikeDayContent(week, day = 1) {
  const key = `../../content/ra-spike/week-${week}/day-${day}/day.json`;
  return dayModules[key] ?? null;
}

/**
 * Coach presentation deck for an RA-SPIKE week/day (if imported).
 * @param {number} week
 * @param {number} [day=1]
 * @returns {{ presentation: object, slides: object[] } | null}
 */
export function getRaSpikeCoachPresentation(week, day = 1) {
  const key = `../../content/ra-spike/week-${week}/day-${day}/presentation.json`;
  const deck = presentationModules[key];
  if (!deck?.presentation || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    return null;
  }
  return deck;
}

/** @returns {Array<{ week: number, day: number, title: string, slideCount: number }>} */
export function listRaSpikeCoachPresentations() {
  /** @type {Array<{ week: number, day: number, title: string, slideCount: number }>} */
  const items = [];
  for (const [path, deck] of Object.entries(presentationModules)) {
    const match = path.match(/week-(\d+)\/day-(\d+)\/presentation/);
    if (!match || !deck?.presentation) continue;
    items.push({
      week: Number(match[1]),
      day: Number(match[2]),
      title: String(deck.presentation.title ?? `Week ${match[1]} Day ${match[2]}`),
      slideCount: Array.isArray(deck.slides) ? deck.slides.length : 0,
    });
  }
  return items.sort((a, b) => a.week - b.week || a.day - b.day);
}
