/**
 * Mentor observation, evaluation, and debrief captures — localStorage + Supabase.
 */
import {
  fetchMentorEncodingResponse,
  upsertMentorEncodingResponse,
} from './supabase/mentorEncodingResponses.js';

const STORAGE_KEY = 'spike_mentor_encoding_responses';

/** @type {Set<string>} */
const hydratedKeys = new Set();

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} staffId @param {string | null | undefined} participantId @param {number} week @param {number} day @param {string} formType */
function storageKey(staffId, participantId, week, day, formType) {
  const who = participantId ?? 'cohort';
  return `${staffId}:${who}:w${week}:d${day}:${formType}`;
}

/**
 * @param {string} staffId
 * @param {string | null | undefined} participantId
 * @param {number} week
 * @param {number} day
 * @param {'observation' | 'debrief' | 'evaluation'} formType
 */
export function getMentorEncoding(staffId, participantId, week, day, formType) {
  const key = storageKey(staffId, participantId, week, day, formType);
  return readAll()[key] ?? null;
}

/**
 * @param {string} staffId
 * @param {string | null | undefined} participantId
 * @param {number} week
 * @param {number} day
 * @param {'observation' | 'debrief' | 'evaluation'} formType
 */
export async function hydrateMentorEncodingFromSupabase(
  staffId,
  participantId,
  week,
  day,
  formType,
) {
  const key = storageKey(staffId, participantId, week, day, formType);
  if (!staffId || String(staffId).startsWith('mock-') || hydratedKeys.has(key)) return;

  if (readAll()[key]) {
    hydratedKeys.add(key);
    return;
  }

  const remote = await fetchMentorEncodingResponse(staffId, participantId, week, day, formType);
  if (!remote) {
    hydratedKeys.add(key);
    return;
  }

  const entry = {
    id: remote.id,
    staffId: remote.staff_id,
    participantId: remote.participant_id,
    week: remote.week,
    day: remote.day,
    formType: remote.form_type,
    templateId: remote.template_id,
    answers: remote.answers ?? {},
    updatedAt: remote.updated_at,
  };

  const all = readAll();
  all[key] = entry;
  writeAll(all);
  hydratedKeys.add(key);
}

/**
 * @param {string} staffId
 * @param {string | null | undefined} participantId
 * @param {{
 *   week?: number,
 *   day: number,
 *   formType: 'observation' | 'debrief' | 'evaluation',
 *   templateId: string,
 *   answers: Record<string, unknown>,
 * }} input
 */
export async function saveMentorEncoding(staffId, participantId, input) {
  if (!staffId || !input.templateId) return null;

  const week = input.week ?? 1;
  const entry = {
    id: `enc-${crypto.randomUUID()}`,
    staffId,
    participantId: participantId ?? null,
    week,
    day: input.day,
    formType: input.formType,
    templateId: input.templateId,
    answers: input.answers ?? {},
    updatedAt: new Date().toISOString(),
  };

  const key = storageKey(staffId, participantId, week, input.day, input.formType);
  const all = readAll();
  all[key] = entry;
  writeAll(all);

  void upsertMentorEncodingResponse(staffId, {
    participantId,
    week,
    day: input.day,
    formType: input.formType,
    templateId: input.templateId,
    answers: input.answers,
  });

  return entry;
}

/** @param {string[]} participantIds @param {string} staffId @param {number} week @param {number} day */
export function countObservationsForDay(participantIds, staffId, week, day) {
  const all = readAll();
  return participantIds.filter((id) =>
    Boolean(all[storageKey(staffId, id, week, day, 'observation')]),
  ).length;
}
