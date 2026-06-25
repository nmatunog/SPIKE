/**
 * Week 2 Day 5 — Empathy Lab (Think Like Miguel) + advisor reflection.
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';

/** @type {Array<{ id: string, label: string, placeholder: string, minLen?: number }>} */
export const EMPATHY_MAP_PROMPTS = [
  { id: 'empathyThinking', label: 'What is Miguel thinking?', placeholder: 'What runs through his mind about money and his future?' },
  { id: 'empathyFeeling', label: 'What is Miguel feeling?', placeholder: 'Pride, anxiety, hope, pressure…' },
  { id: 'empathyWorries', label: 'What worries Miguel?', placeholder: 'What keeps him up at night?' },
  { id: 'empathyAvoiding', label: 'What is Miguel avoiding?', placeholder: 'What does he put off or not talk about?' },
  { id: 'empathyWants', label: 'What does Miguel want?', placeholder: 'Dreams, goals, what success looks like for him.' },
];

/** @type {Array<{ id: string, label: string, placeholder: string, minLen?: number }>} */
export const ADVISOR_REFLECTION_PROMPTS = [
  { id: 'empathySquadInsight', label: 'Squad share — one key insight about Miguel', placeholder: 'The insight your squad will share with the cohort.' },
  { id: 'empathyKeyTakeaways', label: 'Key takeaways', placeholder: 'Patterns and surprises from squad discussion.' },
  { id: 'empathyAdvisorConnection', label: 'Connect to our role', placeholder: 'How does understanding Miguel help us become better future advisors?' },
];

const MIN_LEN = 10;

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function empathyMapComplete(state) {
  return EMPATHY_MAP_PROMPTS.every((p) => String(state[p.id] ?? '').trim().length >= MIN_LEN);
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function advisorReflectionComplete(state) {
  return ADVISOR_REFLECTION_PROMPTS.every((p) => String(state[p.id] ?? '').trim().length >= MIN_LEN);
}

/** @param {string} participantId */
export function getWeek2EmpathyLabState(participantId) {
  const state = loadWeek2Discovery(participantId);
  const allPrompts = [...EMPATHY_MAP_PROMPTS, ...ADVISOR_REFLECTION_PROMPTS];
  return {
    fields: Object.fromEntries(allPrompts.map((p) => [p.id, String(state[p.id] ?? '')])),
    empathyMapComplete: empathyMapComplete(state),
    advisorReflectionComplete: advisorReflectionComplete(state),
    complete: Boolean(state.empathyLabCompletedAt) || (empathyMapComplete(state) && advisorReflectionComplete(state)),
    completedAt: state.empathyLabCompletedAt,
  };
}

/**
 * @param {string} participantId
 * @param {Record<string, string>} patch
 * @param {{ finalize?: boolean }} [opts]
 */
export function saveWeek2EmpathyLab(participantId, patch, opts = {}) {
  const current = loadWeek2Discovery(participantId);
  const merged = { ...current, ...patch };
  const shouldFinalize = opts.finalize || (empathyMapComplete(merged) && advisorReflectionComplete(merged));
  const next = saveWeek2Discovery(participantId, {
    ...patch,
    empathyLabCompletedAt: shouldFinalize
      ? current.empathyLabCompletedAt ?? new Date().toISOString()
      : current.empathyLabCompletedAt,
  });
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId */
export function isWeek2EmpathyLabComplete(participantId) {
  const state = loadWeek2Discovery(participantId);
  return Boolean(state.empathyLabCompletedAt) || (empathyMapComplete(state) && advisorReflectionComplete(state));
}

/** @param {string} participantId */
export function isWeek2EmpathyMapComplete(participantId) {
  return empathyMapComplete(loadWeek2Discovery(participantId));
}

/** @param {string} participantId */
export function isWeek2AdvisorReflectionComplete(participantId) {
  return advisorReflectionComplete(loadWeek2Discovery(participantId));
}
