/**
 * Coaching sessions — local fallback + Supabase (Sprint 04 PR4.3).
 */
import { appendTimelineEvent } from './timelineService.js';
import { createCoachingSession, fetchCoachingSessionsForParticipant } from './supabase/coachingSessions.js';
import { syncCoachingNote } from './ventureBlueprintSync.js';

const STORAGE_KEY = 'spike_coaching_sessions';
const MAX_NOTES = 4000;

/** @type {Set<string>} */
const hydratedParticipants = new Set();

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
 * @param {{ topic?: string, action?: string, concernFlagged?: boolean, followUpDate?: string, discussionSummary?: string, strengths?: string, growthAreas?: string, week?: number, day?: number }} [options]
 */
export async function saveMentorCoachingNote(mentorId, participantId, notes, options = {}) {
  const trimmed = String(notes || '').trim().slice(0, MAX_NOTES);
  if (!trimmed || !mentorId || !participantId) return null;

  const topic = String(options.topic || 'Playbook coaching note').slice(0, 200);

  const actionItems = (options.actionItems ?? [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 8);

  const entry = {
    id: `coach-${crypto.randomUUID()}`,
    mentorId,
    participantId,
    topic,
    action: options.action ?? null,
    notes: trimmed,
    discussionSummary: options.discussionSummary ?? trimmed,
    strengths: options.strengths ?? '',
    growthAreas: options.growthAreas ?? '',
    actionItems,
    week: options.week ?? 1,
    day: options.day ?? 1,
    concernFlagged: Boolean(options.concernFlagged),
    followUpRequired: Boolean(options.followUpRequired ?? options.followUpDate),
    followUpDate: options.followUpDate ?? null,
    completed: Boolean(options.completed),
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
    concernFlagged: options.concernFlagged,
    followUpRequired: options.followUpRequired,
    followUpDate: options.followUpDate,
    completed: options.completed,
    discussionSummary: options.discussionSummary ?? trimmed,
    strengths: options.strengths,
    growthAreas: options.growthAreas,
    actionItems,
    week: options.week,
    day: options.day,
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

/**
 * Structured coaching session save (Module 3).
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{
 *   week?: number,
 *   day?: number,
 *   discussionSummary?: string,
 *   strengths?: string,
 *   growthAreas?: string,
 *   actionItems?: string[],
 *   followUpRequired?: boolean,
 *   followUpDate?: string,
 *   completed?: boolean,
 *   topic?: string,
 * }} input
 */
export async function saveCoachingSession(mentorId, participantId, input) {
  const summary = String(input.discussionSummary ?? '').trim();
  if (!summary || !mentorId || !participantId) return null;

  return saveMentorCoachingNote(mentorId, participantId, summary, {
    topic: input.topic ?? `Week ${input.week ?? 1} Day ${input.day ?? 1} coaching`,
    discussionSummary: summary,
    strengths: input.strengths,
    growthAreas: input.growthAreas,
    actionItems: input.actionItems,
    followUpRequired: input.followUpRequired,
    followUpDate: input.followUpDate,
    completed: input.completed,
    week: input.week,
    day: input.day,
  });
}

/** @param {string} sessionId @param {string} participantId */
export function markCoachingSessionComplete(sessionId, participantId) {
  const all = readAll();
  const list = all[participantId] ?? [];
  const next = list.map((entry) =>
    entry.id === sessionId ? { ...entry, completed: true, completedAt: new Date().toISOString() } : entry,
  );
  all[participantId] = next;
  writeAll(all);
  return next.find((e) => e.id === sessionId) ?? null;
}

/** @param {string} participantId */
export function listCoachingNotesForParticipant(participantId) {
  return readAll()[participantId] ?? [];
}

/**
 * Merge Supabase coaching history into local cache when local is empty.
 * @param {string} participantId
 */
export async function hydrateCoachingFromSupabase(participantId) {
  if (!participantId || String(participantId).startsWith('mock-') || hydratedParticipants.has(participantId)) {
    return;
  }

  const local = readAll()[participantId] ?? [];
  if (local.length > 0) {
    hydratedParticipants.add(participantId);
    return;
  }

  const remote = await fetchCoachingSessionsForParticipant(participantId);
  if (!remote?.length) {
    hydratedParticipants.add(participantId);
    return;
  }

  const all = readAll();
  const mapped = remote.map((row) => ({
    id: row.id,
    mentorId: row.mentor_id,
    participantId: row.participant_id,
    topic: row.topic,
    notes: row.notes ?? row.discussion_summary ?? '',
    discussionSummary: row.discussion_summary ?? row.notes ?? '',
    strengths: row.strengths ?? '',
    growthAreas: row.growth_areas ?? '',
    actionItems: Array.isArray(row.action_items) ? row.action_items : [],
    week: row.week ?? 1,
    day: row.day ?? 1,
    concernFlagged: Boolean(row.concern_flagged),
    followUpRequired: Boolean(row.follow_up_required),
    followUpDate: row.follow_up_date ?? null,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  }));

  all[participantId] = mapped.slice(0, 30);
  writeAll(all);
  hydratedParticipants.add(participantId);
}

/** @param {string[]} participantIds */
export function listAllCoachingSessionsForParticipants(participantIds) {
  const all = readAll();
  return participantIds.flatMap((id) => (all[id] ?? []).map((entry) => ({ ...entry, participantId: id })));
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
  'Flag Concern': 'Venture Coach — concern flagged',
  'Schedule Follow-Up': 'Venture Coach — follow-up scheduled',
};

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {'Comment' | 'Approve' | 'Request Reflection' | 'Flag Concern' | 'Schedule Follow-Up'} action
 * @param {string} [notes]
 * @param {{ followUpDate?: string, week?: number, day?: number }} [meta]
 */
export async function saveVentureCoachMentorFeedback(mentorId, participantId, action, notes = '', meta = {}) {
  const topic = VENTURE_COACH_TOPICS[action] ?? 'Venture Coach — mentor feedback';
  const trimmedNote = String(notes || '').trim();
  const body =
    trimmedNote ||
    (action === 'Approve'
      ? 'Mentor approved your Venture Coach journey.'
      : action === 'Request Reflection'
        ? 'Mentor requested a reflection on your Venture Coach statements.'
        : action === 'Flag Concern'
          ? 'Mentor flagged a concern for follow-up coaching.'
          : action === 'Schedule Follow-Up'
            ? `Mentor scheduled a follow-up${meta.followUpDate ? ` on ${meta.followUpDate}` : ''}.`
            : 'Mentor left feedback on your Venture Coach journey.');

  return saveMentorCoachingNote(mentorId, participantId, body, {
    topic,
    action,
    concernFlagged: action === 'Flag Concern',
    followUpDate: meta.followUpDate,
    week: meta.week,
    day: meta.day,
    discussionSummary: trimmedNote || body,
  });
}
