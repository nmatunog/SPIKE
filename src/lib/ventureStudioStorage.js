/**
 * Day 3 Venture Studio — squad research workspace (local + optional cloud later).
 */
export const VENTURE_STUDIO_DAY3_MODULE_ID = 'venture-studio-day-3';
export const DAY3_PLAYBOOK_ID = 'day-segment-1-week-1-day-3';

const STORAGE_KEY = 'spike_venture_studio_day3';

/** @returns {import('./ventureStudioTypes.js').VentureStudioState} */
export function emptyVentureStudioState() {
  return {
    currentStep: 1,
    highestStepReached: 1,
    isStarted: false,
    isCanvasComplete: false,
    showDay4Canvas: false,
    squadName: '',
    targetSegment: '',
    step1: { description: '', stage: '', dayInLife: '', surprise: '' },
    step2: {
      goals: {
        house: false,
        education: false,
        retirement: false,
        business: false,
        freedom: false,
        security: false,
        travel: false,
        others: false,
      },
      whyImportant: '',
    },
    step3: [
      { problem: '', evidence: '', confidence: 'Medium', images: [] },
      { problem: '', evidence: '', confidence: 'Medium', images: [] },
      { problem: '', evidence: '', confidence: 'Medium', images: [] },
    ],
    step4: [{ solution: '', advantages: '', limitations: '', opportunity: '' }],
    step5: { suggests: '', unmetNeed: '', valueCreation: '' },
    evidenceList: [],
    updatedAt: null,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[ventureStudio] save failed:', err instanceof Error ? err.message : err);
  }
}

/** @param {unknown[]} stored @param {import('./ventureStudioTypes.js').VentureStudioState['step3']} fallback */
function normalizeStep3(stored, fallback) {
  if (!Array.isArray(stored)) return fallback;
  return fallback.map((item, index) => ({ ...item, ...(stored[index] ?? {}) }));
}

/** @param {unknown[]} stored @param {import('./ventureStudioTypes.js').VentureStudioState['step4']} fallback */
function normalizeStep4(stored, fallback) {
  if (!Array.isArray(stored) || stored.length === 0) return fallback;
  const template = fallback[0];
  return stored.map((item) => ({
    ...template,
    ...(typeof item === 'object' && item ? item : {}),
  }));
}

/** @param {string | undefined | null} participantId */
export function loadVentureStudioState(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) {
    return emptyVentureStudioState();
  }
  const stored = readAll()[participantId];
  if (!stored) return emptyVentureStudioState();
  return {
    ...emptyVentureStudioState(),
    ...stored,
    step1: { ...emptyVentureStudioState().step1, ...(stored.step1 ?? {}) },
    step2: {
      ...emptyVentureStudioState().step2,
      ...(stored.step2 ?? {}),
      goals: {
        ...emptyVentureStudioState().step2.goals,
        ...(stored.step2?.goals ?? {}),
      },
    },
    step3: normalizeStep3(stored.step3, emptyVentureStudioState().step3),
    step4: normalizeStep4(stored.step4, emptyVentureStudioState().step4),
    step5: { ...emptyVentureStudioState().step5, ...(stored.step5 ?? {}) },
    evidenceList: Array.isArray(stored.evidenceList) ? stored.evidenceList : [],
  };
}

/**
 * @param {string | undefined | null} participantId
 * @param {import('./ventureStudioTypes.js').VentureStudioState} state
 */
export function saveVentureStudioState(participantId, state) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  const all = readAll();
  all[participantId] = { ...state, updatedAt: new Date().toISOString() };
  writeAll(all);
}

/** @param {import('./ventureStudioTypes.js').VentureStudioState} state */
export function ventureStudioProgressPercent(state) {
  if (state.isCanvasComplete) return 100;
  if (!state.isStarted) return 0;
  const stepPct = ((state.highestStepReached - 1) / 5) * 80;
  const squadPct = state.squadName.trim() ? 10 : 0;
  const segmentPct = state.targetSegment.trim() ? 10 : 0;
  return Math.min(99, Math.round(stepPct + squadPct + segmentPct));
}
