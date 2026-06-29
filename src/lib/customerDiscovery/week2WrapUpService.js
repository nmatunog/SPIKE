/**
 * Week 2 Friday wrap-up — intern learnings → portfolio.
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';

/** @type {Array<{ id: keyof import('./week2DiscoveryTypes.js').Week2DiscoveryState, label: string, placeholder: string }>} */
export const WEEK2_WRAP_UP_PROMPTS = [
  {
    id: 'weekWrapBiggestLearning',
    label: 'Biggest learning',
    placeholder: 'What surprised you most from customers this week?',
  },
  {
    id: 'weekWrapEvidenceShift',
    label: 'Evidence shift',
    placeholder: 'What did you believe before interviews — and what does evidence say now?',
  },
  {
    id: 'weekWrapVentureEvolution',
    label: 'Venture evolution',
    placeholder: 'How did your FEC / venture story change from Monday to Friday?',
  },
  {
    id: 'weekWrapWeek3Focus',
    label: 'Week 3 — Discover Your Business Model',
    placeholder: 'What would you ask Miguel before building your venture? One question to open Week 3.',
  },
];

const MIN_FIELD_LEN = 12;

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function wrapFieldsComplete(state) {
  return WEEK2_WRAP_UP_PROMPTS.every(
    (p) => String(state[p.id] ?? '').trim().length >= MIN_FIELD_LEN,
  );
}

/** @param {string} participantId */
export function getWeek2WrapUpState(participantId) {
  const state = loadWeek2Discovery(participantId);
  return {
    fields: Object.fromEntries(
      WEEK2_WRAP_UP_PROMPTS.map((p) => [p.id, String(state[p.id] ?? '')]),
    ),
    complete: Boolean(state.weekWrapCompletedAt) || wrapFieldsComplete(state),
    completedAt: state.weekWrapCompletedAt,
  };
}

/**
 * @param {string} participantId
 * @param {Partial<Record<'weekWrapBiggestLearning' | 'weekWrapEvidenceShift' | 'weekWrapVentureEvolution' | 'weekWrapWeek3Focus', string>>} patch
 * @param {{ finalize?: boolean }} [opts]
 */
export function saveWeek2WrapUp(participantId, patch, opts = {}) {
  const current = loadWeek2Discovery(participantId);
  const nextFields = {
    weekWrapBiggestLearning: patch.weekWrapBiggestLearning ?? current.weekWrapBiggestLearning,
    weekWrapEvidenceShift: patch.weekWrapEvidenceShift ?? current.weekWrapEvidenceShift,
    weekWrapVentureEvolution: patch.weekWrapVentureEvolution ?? current.weekWrapVentureEvolution,
    weekWrapWeek3Focus: patch.weekWrapWeek3Focus ?? current.weekWrapWeek3Focus,
  };
  const merged = { ...current, ...nextFields };
  const shouldFinalize = opts.finalize || wrapFieldsComplete(merged);
  const next = saveWeek2Discovery(participantId, {
    ...nextFields,
    weekWrapCompletedAt: shouldFinalize
      ? current.weekWrapCompletedAt ?? new Date().toISOString()
      : current.weekWrapCompletedAt,
  });
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId */
export function isWeek2WrapUpComplete(participantId) {
  const state = loadWeek2Discovery(participantId);
  return Boolean(state.weekWrapCompletedAt) || wrapFieldsComplete(state);
}
