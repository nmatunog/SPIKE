import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { isMockUserId, updateMockInternProgress } from './mockAuth.js';
import { RA_SPIKE_PROGRAM } from './programs/ra-spike.js';
import { isRaSpikeWeekContentReady } from './raSpikeContentLoader.js';

const GATE_PREP_PREFIX = 'ra_spike_gate_prep_v1';

/**
 * Stage gate prep checklist — empty until that week’s RA-SPIKE content is authored.
 * Never invent internship FEC / persona / pitch items.
 * @param {number} gateNum
 */
export function getGatePrepChecklist(gateNum) {
  const week = gateNum === 1 ? 4 : 8;
  if (!isRaSpikeWeekContentReady(week)) return [];
  return [];
}

/** @param {string} participantId @param {number} gateNum */
export function getGatePrepState(participantId, gateNum) {
  try {
    const raw = localStorage.getItem(`${GATE_PREP_PREFIX}:${participantId}:g${gateNum}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {string} participantId @param {number} gateNum @param {Record<string, boolean>} state */
export function saveGatePrepState(participantId, gateNum, state) {
  try {
    localStorage.setItem(`${GATE_PREP_PREFIX}:${participantId}:g${gateNum}`, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** @param {string} participantId @param {number} gateNum */
export function isGatePrepComplete(participantId, gateNum) {
  const items = getGatePrepChecklist(gateNum);
  if (!items.length) return false;
  const state = getGatePrepState(participantId, gateNum);
  return items.every((item) => state[item.id]);
}

/** @param {object | null | undefined} progress */
export function getRaSpikeGateStatus(progress, gateNum) {
  if (gateNum === 1) return progress?.gate_1_status ?? null;
  return progress?.gate_2_status ?? null;
}

/** @param {object | null | undefined} progress */
export function isRaSpikeGraduated(progress) {
  return Boolean(progress?.graduated_at) || progress?.gate_2_status === 'passed';
}

/**
 * @param {string} participantId
 * @param {number} gateNum
 * @param {'passed' | 'failed'} result
 */
export async function staffEvaluateRaSpikeGate(participantId, gateNum, result) {
  const passed = result === 'passed';
  if (isMockUserId(participantId)) {
    const patch =
      gateNum === 1
        ? {
            gate_1_status: passed ? 'passed' : 'failed',
            gate_1_evaluated_at: new Date().toISOString(),
            ...(passed
              ? { ra_spike_segment: 2, ra_spike_current_week: 5 }
              : {}),
          }
        : {
            gate_2_status: passed ? 'passed' : 'failed',
            gate_2_evaluated_at: new Date().toISOString(),
            ...(passed ? { graduated_at: new Date().toISOString() } : {}),
          };
    return updateMockInternProgress(participantId, patch);
  }
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase required.');
  }
  const { data, error } = await supabase.rpc('evaluate_ra_spike_gate', {
    p_user_id: participantId,
    p_gate: gateNum,
    p_result: result,
  });
  if (error) throw error;
  return data;
}

/** @param {string} participantId */
export async function graduateRaSpikeParticipant(participantId, transitionToInternship = false) {
  if (isMockUserId(participantId)) {
    return updateMockInternProgress(participantId, {
      gate_2_status: 'passed',
      graduated_at: new Date().toISOString(),
      ...(transitionToInternship ? { program_slug: 'spike-internship' } : {}),
    });
  }
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase required.');
  const { data, error } = await supabase.rpc('graduate_ra_spike', {
    p_transition_internship: transitionToInternship,
  });
  if (error) throw error;
  return data;
}

/** @param {number} week */
export function gateNumberForWeek(week) {
  const gate = RA_SPIKE_PROGRAM.stageGates.find((g) => g.week === week);
  if (!gate) return null;
  return gate.id === 'venture-pitch' ? 1 : gate.id === 'advisor-revalida' ? 2 : null;
}
