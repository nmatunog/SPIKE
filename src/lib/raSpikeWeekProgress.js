import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { isMockUserId, updateMockInternProgress } from './mockAuth.js';
import {
  RA_SPIKE_STEP_ORDER,
} from './raSpikeContentLoader.js';

const STORAGE_PREFIX = 'ra_spike_week_progress_v1';

/** @typedef {'not_started' | 'in_progress' | 'complete'} RaSpikeStepStatus */
/** @typedef {'learn' | 'workshop' | 'assignment' | 'reflection' | 'submit'} RaSpikeStepId */

/**
 * @typedef {Object} RaSpikeWeekProgressRow
 * @property {RaSpikeStepStatus} [learn]
 * @property {RaSpikeStepStatus} [workshop]
 * @property {RaSpikeStepStatus} [assignment]
 * @property {RaSpikeStepStatus} [reflection]
 * @property {RaSpikeStepStatus} [submit]
 * @property {string} [reflectionNotes]
 * @property {string | null} [weekSubmittedAt]
 */

/** @param {string} participantId @param {number} week */
function storageKey(participantId, week) {
  return `${STORAGE_PREFIX}:${participantId}:w${week}`;
}

/** @param {Record<string, unknown> | null | undefined} row */
function mapDbRow(row) {
  if (!row) return {};
  return {
    learn: row.learn_status ?? 'not_started',
    workshop: row.workshop_status ?? 'not_started',
    assignment: row.assignment_status ?? 'not_started',
    reflection: row.reflection_status ?? 'not_started',
    submit: row.submit_status ?? 'not_started',
    reflectionNotes: row.reflection_notes ?? '',
    weekSubmittedAt: row.week_submitted_at ?? null,
  };
}

/** @param {string} participantId @param {number} week */
export function getRaSpikeWeekProgressLocal(participantId, week) {
  if (!participantId) return {};
  try {
    const raw = localStorage.getItem(storageKey(participantId, week));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {string} participantId @param {number} week @param {RaSpikeWeekProgressRow} patch */
function writeRaSpikeWeekProgressLocal(participantId, week, patch) {
  if (!participantId) return;
  const next = { ...getRaSpikeWeekProgressLocal(participantId, week), ...patch };
  try {
    localStorage.setItem(storageKey(participantId, week), JSON.stringify(next));
  } catch {
    /* quota */
  }
}

/** @param {string} participantId @param {number} week */
export async function fetchRaSpikeWeekProgress(participantId, week) {
  const local = getRaSpikeWeekProgressLocal(participantId, week);
  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    return local;
  }

  const { data, error } = await supabase
    .from('ra_spike_week_progress')
    .select(
      'learn_status, workshop_status, assignment_status, reflection_status, submit_status, reflection_notes, week_submitted_at',
    )
    .eq('user_id', participantId)
    .eq('week', week)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '')) {
      return local;
    }
    throw error;
  }

  const remote = mapDbRow(data);
  const merged = { ...local, ...remote };
  writeRaSpikeWeekProgressLocal(participantId, week, merged);
  return merged;
}

/**
 * @param {string} participantId
 * @param {number} week
 * @param {RaSpikeStepId} stepId
 * @param {RaSpikeStepStatus} status
 * @param {{ reflectionNotes?: string }} [opts]
 */
export async function setRaSpikeStepStatus(participantId, week, stepId, status, opts = {}) {
  const patch = { [stepId]: status };
  if (opts.reflectionNotes !== undefined) {
    patch.reflectionNotes = opts.reflectionNotes;
  }
  writeRaSpikeWeekProgressLocal(participantId, week, patch);

  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    return getRaSpikeWeekProgressLocal(participantId, week);
  }

  const column = `${stepId}_status`;
  const payload = {
    user_id: participantId,
    week,
    [column]: status,
    updated_at: new Date().toISOString(),
  };
  if (opts.reflectionNotes !== undefined) {
    payload.reflection_notes = opts.reflectionNotes;
  }

  const { error } = await supabase.from('ra_spike_week_progress').upsert(payload, {
    onConflict: 'user_id,week',
  });

  if (error && !(error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? ''))) {
    throw error;
  }

  return fetchRaSpikeWeekProgress(participantId, week);
}

/** @param {string} participantId @param {number} week */
export async function submitRaSpikeWeek(participantId, week) {
  if (!participantId) throw new Error('Sign in required.');

  if (isMockUserId(participantId)) {
    writeRaSpikeWeekProgressLocal(participantId, week, {
      submit: 'complete',
      weekSubmittedAt: new Date().toISOString(),
    });
    const current = getRaSpikeWeekProgressLocal(participantId, week);
    let patch = {};
    if (week === 4) {
      patch = { gate_1_status: 'pending' };
    } else if (week === 8) {
      patch = { gate_2_status: 'pending' };
    } else if (week < 8) {
      patch = {
        ra_spike_current_week: week + 1,
        ra_spike_segment: week + 1 >= 5 ? 2 : 1,
      };
    }
    const mockProgress = updateMockInternProgress(participantId, patch);
    return { progress: current, internProgress: mockProgress };
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Submit requires Supabase.');
  }

  const { data, error } = await supabase.rpc('submit_ra_spike_week', { p_week: week });
  if (error) throw error;

  const mapped = mapDbRow(data);
  writeRaSpikeWeekProgressLocal(participantId, week, mapped);
  return { progress: mapped, internProgress: null };
}

/** @param {string} participantId @param {number} week */
export function getRaSpikeAssignmentStatus(participantId, week) {
  const progress = getRaSpikeWeekProgressLocal(participantId, week);
  const status = progress?.assignment;
  if (status === 'complete' || status === 'in_progress') return status;
  return 'not_started';
}

/** @param {RaSpikeWeekProgressRow} progress @param {RaSpikeStepId} stepId */
export function getStepStatus(progress, stepId) {
  const value = progress?.[stepId];
  if (value === 'complete' || value === 'in_progress') return value;
  return 'not_started';
}

/** @param {RaSpikeWeekProgressRow} progress @param {RaSpikeStepId} stepId */
export function isRaSpikeStepUnlocked(progress, stepId) {
  const index = RA_SPIKE_STEP_ORDER.indexOf(stepId);
  if (index <= 0) return true;
  const prior = RA_SPIKE_STEP_ORDER[index - 1];
  return getStepStatus(progress, prior) === 'complete';
}

/** @param {RaSpikeWeekProgressRow} progress */
export function canSubmitRaSpikeWeek(progress) {
  return RA_SPIKE_STEP_ORDER.slice(0, -1).every((step) => getStepStatus(progress, step) === 'complete')
    && getStepStatus(progress, 'submit') !== 'complete';
}

/** @param {RaSpikeWeekProgressRow} progress */
export function raSpikeWeekPercentComplete(progress) {
  const done = RA_SPIKE_STEP_ORDER.filter((s) => getStepStatus(progress, s) === 'complete').length;
  return Math.round((done / RA_SPIKE_STEP_ORDER.length) * 100);
}
