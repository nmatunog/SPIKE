import { WEEK4_DAY2_MISSIONS } from './missionConstants.js';

export const WEEK4_DAY2_STORAGE_KEY = 'spike_week4_day2_mission_v1';

/** @returns {import('./types.js').Week4Day2MissionState} */
export function defaultWeek4Day2MissionState(participantId = '') {
  return {
    participantId,
    currentStep: 1,
    completedSteps: [],
    drafts: {
      mission1: { fiveXChallenge: '' },
      mission2: {
        stageId: '',
        bottleneck: '',
        solution: '',
        expectedImpact: '',
      },
      mission3: { leadershipMultiplier: '' },
    },
    completedAt: null,
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(WEEK4_DAY2_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(WEEK4_DAY2_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId @returns {import('./types.js').Week4Day2MissionState} */
export function loadWeek4Day2Mission(participantId) {
  if (!participantId) return defaultWeek4Day2MissionState();
  const row = readAll()[participantId];
  if (!row) return defaultWeek4Day2MissionState(participantId);
  const base = defaultWeek4Day2MissionState(participantId);
  return {
    ...base,
    ...row,
    drafts: {
      ...base.drafts,
      ...row.drafts,
      mission1: { ...base.drafts.mission1, ...(row.drafts?.mission1 ?? {}) },
      mission2: { ...base.drafts.mission2, ...(row.drafts?.mission2 ?? {}) },
      mission3: { ...base.drafts.mission3, ...(row.drafts?.mission3 ?? {}) },
    },
  };
}

/** @param {string} participantId @param {import('./types.js').Week4Day2MissionState} state */
export function saveWeek4Day2Mission(participantId, state) {
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

/** @param {import('./types.js').Week4Day2MissionState} state */
export function computeWeek4Day2Progress(state) {
  const totalSteps = WEEK4_DAY2_MISSIONS.length;
  const done = state.completedSteps.length;
  const pct = Math.round((done / totalSteps) * 100);
  return { done, total: totalSteps, pct };
}

/** @param {import('./types.js').Week4Day2MissionState} state */
export function isWeek4Day2MissionComplete(state) {
  return [1, 2, 3].every((step) => state.completedSteps.includes(step));
}
