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
 */
export async function saveMentorCoachingNote(mentorId, participantId, notes) {
  const trimmed = String(notes || '').trim().slice(0, MAX_NOTES);
  if (!trimmed || !mentorId || !participantId) return null;

  const entry = {
    id: `coach-${crypto.randomUUID()}`,
    mentorId,
    participantId,
    topic: 'Playbook coaching note',
    notes: trimmed,
    createdAt: new Date().toISOString(),
  };

  const all = readAll();
  const list = all[participantId] ?? [];
  list.unshift(entry);
  all[participantId] = list.slice(0, 30);
  writeAll(all);

  void createCoachingSession(mentorId, participantId, {
    topic: entry.topic,
    notes: trimmed,
  });

  appendTimelineEvent(participantId, {
    type: 'coaching_note',
    title: 'Mentor coaching note saved',
    module: 'leadership-growth',
    sourceType: 'coaching',
    sourceId: entry.id,
  });

  void syncCoachingNote(participantId, {
    mentorId,
    topic: entry.topic,
    notes: trimmed,
    sourceId: entry.id,
  });

  return entry;
}

/** @param {string} participantId */
export function listCoachingNotesForParticipant(participantId) {
  return readAll()[participantId] ?? [];
}
