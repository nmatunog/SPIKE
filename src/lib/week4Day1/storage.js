import { WEEK4_DAY1_MISSIONS } from './missionConstants.js';

export const WEEK4_DAY1_STORAGE_KEY = 'spike_week4_day1_mission_v1';

/** @returns {import('./types.js').Week4Day1MissionState} */
export function defaultWeek4Day1MissionState(participantId = '') {
  return {
    participantId,
    currentStep: 1,
    completedSteps: [],
    drafts: {
      mission1: {
        finalProposition: '',
        propositionKind: 'venture',
        toolRelocatedTo: '',
        brainstormNotes: '',
      },
      mission2: {
        clientExperience: '',
        journey: { discover: '', plan: '', protect: '', review: '', refer: '' },
      },
      mission3: {
        winningStrategy: '',
      },
      mission4: {
        selected: {
          advisorExcellence: [],
          teamLeadership: [],
          systemsScale: [],
        },
        summary: '',
      },
      blueprint: {
        keyActivities: '',
        keyResources: '',
      },
    },
    founderReviewAcknowledged: false,
    completedAt: null,
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(WEEK4_DAY1_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(WEEK4_DAY1_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId @returns {import('./types.js').Week4Day1MissionState} */
export function loadWeek4Day1Mission(participantId) {
  if (!participantId) return defaultWeek4Day1MissionState();
  const row = readAll()[participantId];
  if (!row) return defaultWeek4Day1MissionState(participantId);
  const base = defaultWeek4Day1MissionState(participantId);
  return {
    ...base,
    ...row,
    drafts: {
      ...base.drafts,
      ...row.drafts,
      mission1: { ...base.drafts.mission1, ...(row.drafts?.mission1 ?? {}) },
      mission2: {
        ...base.drafts.mission2,
        ...(row.drafts?.mission2 ?? {}),
        journey: {
          ...base.drafts.mission2.journey,
          ...(row.drafts?.mission2?.journey ?? {}),
        },
      },
      mission3: { ...base.drafts.mission3, ...(row.drafts?.mission3 ?? {}) },
      mission4: {
        ...base.drafts.mission4,
        ...(row.drafts?.mission4 ?? {}),
        selected: {
          ...base.drafts.mission4.selected,
          ...(row.drafts?.mission4?.selected ?? {}),
        },
      },
      blueprint: { ...base.drafts.blueprint, ...(row.drafts?.blueprint ?? {}) },
    },
  };
}

/** @param {string} participantId @param {import('./types.js').Week4Day1MissionState} state */
export function saveWeek4Day1Mission(participantId, state) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const next = {
    ...state,
    participantId,
    updatedAt: now,
    createdAt: state.createdAt ?? all[participantId]?.createdAt ?? now,
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {import('./types.js').Week4Day1MissionState} state */
export function computeWeek4Day1Progress(state) {
  const totalSteps = WEEK4_DAY1_MISSIONS.length + 1;
  const done = state.completedSteps.length;
  const pct = Math.round((done / totalSteps) * 100);
  return { done, total: totalSteps, pct };
}

/** @param {import('./types.js').Week4Day1MissionState} state */
export function isWeek4Day1MissionComplete(state) {
  const required = [1, 2, 3, 4, 5, 6];
  return required.every((step) => state.completedSteps.includes(step));
}
