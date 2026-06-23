/**
 * Week 2 Customer Discovery — local persistence.
 */
import { DEFAULT_INTERVIEW_QUESTIONS } from './week2Constants.js';

const STORAGE_KEY = 'spike_week2_discovery_v2';
const LEGACY_STORAGE_KEY = 'spike_week2_discovery_v1';

function readAll() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (Object.keys(current).length) return current;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}');
    return legacy;
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @returns {import('./week2DiscoveryTypes.js').Week2DiscoveryState} */
export function defaultWeek2State() {
  return {
    missionAcknowledged: false,
    assumptionsCompletedAt: null,
    guideCompletedAt: null,
    researchPlanSubmittedAt: null,
    squadAlignedAt: null,
    portfolioSyncedAt: null,
    exchangeReflectionAt: null,
    professionalReadinessAt: null,
    readinessReflectionAt: null,
    synthesisReviewedAt: null,
    intelligenceBoardAt: null,
    pitchStartedAt: null,
    pitchSubmittedAt: null,
    assumptions: [],
    questions: DEFAULT_INTERVIEW_QUESTIONS.map((q) => ({ ...q })),
    thinkingShifts: [],
    interviews: [],
    fieldResearchPlan: '',
    squadDiscussionNotes: '',
    readinessEvidenceNote: '',
    pitchOutline: {
      mission: '',
      whoInterviewed: '',
      whatWeThought: '',
      whatWeLearned: '',
      customerVoices: '',
      biggestProblem: '',
      beliefShift: '',
      ventureChanged: '',
      nextSteps: '',
      advisorInsight: '',
    },
    updatedAt: null,
  };
}

/** @param {string} participantId */
export function loadWeek2Discovery(participantId) {
  const stored = readAll()[participantId];
  if (!stored) return defaultWeek2State();
  return {
    ...defaultWeek2State(),
    ...stored,
    questions: stored.questions?.length ? stored.questions : defaultWeek2State().questions,
    assumptions: stored.assumptions ?? [],
    thinkingShifts: stored.thinkingShifts ?? [],
    interviews: (stored.interviews ?? []).map((iv) => ({
      id: iv.id ?? `iv-${Date.now()}`,
      alias: iv.alias ?? '',
      occupation: iv.occupation ?? '',
      answers: Array.isArray(iv.answers) ? iv.answers : [],
      reflection: iv.reflection ?? '',
      encoded: Boolean(iv.encoded),
      aiInsights: iv.aiInsights ?? undefined,
      encodedAt: iv.encodedAt ?? null,
    })),
    fieldResearchPlan: stored.fieldResearchPlan ?? '',
    squadDiscussionNotes: stored.squadDiscussionNotes ?? '',
    readinessEvidenceNote: stored.readinessEvidenceNote ?? '',
    pitchOutline: { ...defaultWeek2State().pitchOutline, ...(stored.pitchOutline ?? {}) },
  };
}

/**
 * @param {string} participantId
 * @param {Partial<import('./week2DiscoveryTypes.js').Week2DiscoveryState>} patch
 */
export function saveWeek2Discovery(participantId, patch) {
  const all = readAll();
  const current = loadWeek2Discovery(participantId);
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {string} participantId */
export function resetWeek2Discovery(participantId) {
  const all = readAll();
  delete all[participantId];
  writeAll(all);
}
