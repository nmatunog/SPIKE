const STORAGE_PREFIX = 'ra_spike_week_progress_v1';

/** @typedef {'not_started' | 'in_progress' | 'complete'} RaSpikeStepStatus */

/** @param {string} participantId @param {number} week */
function storageKey(participantId, week) {
  return `${STORAGE_PREFIX}:${participantId}:w${week}`;
}

/** @param {string} participantId @param {number} week */
export function getRaSpikeWeekProgress(participantId, week) {
  if (!participantId) return {};
  try {
    const raw = localStorage.getItem(storageKey(participantId, week));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {string} participantId @param {number} week */
export function getRaSpikeAssignmentStatus(participantId, week) {
  const progress = getRaSpikeWeekProgress(participantId, week);
  const status = progress?.assignment;
  if (status === 'complete' || status === 'in_progress') return status;
  return 'not_started';
}

/**
 * @param {string} participantId
 * @param {number} week
 * @param {Partial<{ assignment: RaSpikeStepStatus }>} patch
 */
export function patchRaSpikeWeekProgress(participantId, week, patch) {
  if (!participantId) return;
  const next = { ...getRaSpikeWeekProgress(participantId, week), ...patch };
  try {
    localStorage.setItem(storageKey(participantId, week), JSON.stringify(next));
  } catch {
    /* quota */
  }
}
