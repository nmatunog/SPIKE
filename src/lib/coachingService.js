/**
 * Coaching sessions — local fallback + Supabase (Sprint 04 PR4.3).
 */
import { appendTimelineEvent } from './timelineService.js';
import { createCoachingSession } from './supabase/coachingSessions.js';
import { syncCoachingNote } from './ventureBlueprintSync.js';

const STORAGE_KEY = 'spike_coaching_sessions';
const MAX_NOTES = 4000;

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

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {string} notes
 * @param {{ topic?: string, action?: string }} [options]
 */
export async function saveMentorCoachingNote(mentorId, participantId, notes, options = {}) {
  const trimmed = String(notes || '').trim().slice(0, MAX_NOTES);
  if (!trimmed || !mentorId || !participantId) return null;

  const topic = String(options.topic || 'Playbook coaching note').slice(0, 200);

  const entry = {
    id: `coach-${crypto.randomUUID()}`,
    mentorId,
    participantId,
    topic,
    action: options.action ?? null,
    notes: trimmed,
    createdAt: new Date().toISOString(),
  };

  const all = readAll();
  const list = all[participantId] ?? [];
  list.unshift(entry);
  all[participantId] = list.slice(0, 30);
  writeAll(all);

  void createCoachingSession(mentorId, participantId, {
    topic,
    notes: trimmed,
  });

  appendTimelineEvent(participantId, {
    type: 'coaching_note',
    title: topic,
    module: 'leadership-growth',
    sourceType: 'coaching',
    sourceId: entry.id,
  });

  void syncCoachingNote(participantId, {
    mentorId,
    topic,
    notes: trimmed,
    sourceId: entry.id,
  });

  return entry;
}

/** @param {string} participantId */
export function listCoachingNotesForParticipant(participantId) {
  return readAll()[participantId] ?? [];
}

/** @param {string[]} participantIds */
export function countCoachingNotesForParticipants(participantIds) {
  const all = readAll();
  return participantIds.reduce((total, id) => total + (all[id]?.length ?? 0), 0);
}

const VENTURE_COACH_TOPICS = {
  Comment: 'Venture Coach — mentor comment',
  Approve: 'Venture Coach — approved',
  'Request Reflection': 'Venture Coach — reflection requested',
};

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {'Comment' | 'Approve' | 'Request Reflection'} action
 * @param {string} [notes]
 */
export async function saveVentureCoachMentorFeedback(mentorId, participantId, action, notes = '') {
  const topic = VENTURE_COACH_TOPICS[action] ?? 'Venture Coach — mentor feedback';
  const trimmedNote = String(notes || '').trim();
  const body =
    trimmedNote ||
    (action === 'Approve'
      ? 'Mentor approved your Venture Coach journey.'
      : action === 'Request Reflection'
        ? 'Mentor requested a reflection on your Venture Coach statements.'
        : 'Mentor left feedback on your Venture Coach journey.');

  return saveMentorCoachingNote(mentorId, participantId, body, { topic, action });
}
