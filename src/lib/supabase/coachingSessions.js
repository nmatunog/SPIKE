import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const MAX_TOPIC = 200;
const MAX_NOTES = 4000;

const COACHING_SESSION_COLUMNS_FULL =
  'id, mentor_id, participant_id, topic, notes, week, day, discussion_summary, strengths, growth_areas, action_items, concern_flagged, follow_up_required, follow_up_date, completed, created_at';

const COACHING_SESSION_COLUMNS_LEGACY =
  'id, mentor_id, participant_id, topic, notes, week, day, discussion_summary, strengths, growth_areas, action_items, concern_flagged, follow_up_date, created_at';

/** @param {string} message */
function isMissingCoachingColumnError(message) {
  return /follow_up_required|follow_up_date|\bcompleted\b|does not exist|schema cache/i.test(
    String(message ?? ''),
  );
}

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{ topic: string, notes: string, week?: number, day?: number, discussionSummary?: string, strengths?: string, growthAreas?: string, concernFlagged?: boolean, followUpRequired?: boolean, followUpDate?: string, completed?: boolean, actionItems?: string[] }} input
 */
export async function createCoachingSession(mentorId, participantId, input) {
  if (!isSupabaseConfigured || !supabase || !mentorId || !participantId) return null;

  const topic = String(input.topic || 'Coaching check-in').slice(0, MAX_TOPIC);
  const notes = String(input.notes || '').slice(0, MAX_NOTES);

  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert({
      participant_id: participantId,
      mentor_id: mentorId,
      topic,
      notes: notes || null,
      week: input.week ?? null,
      day: input.day ?? null,
      discussion_summary: input.discussionSummary ?? null,
      strengths: input.strengths ?? null,
      growth_areas: input.growthAreas ?? null,
      concern_flagged: Boolean(input.concernFlagged),
      follow_up_required: Boolean(input.followUpRequired),
      follow_up_date: input.followUpDate ?? null,
      completed: Boolean(input.completed),
      action_items: input.actionItems ?? [],
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[coachingSessions] insert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * @param {string} participantId
 * @param {number} [limit]
 */
export async function fetchCoachingSessionsForParticipant(participantId, limit = 30) {
  if (!isSupabaseConfigured || !supabase || !participantId) return [];

  let { data, error } = await supabase
    .from('coaching_sessions')
    .select(COACHING_SESSION_COLUMNS_FULL)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error && isMissingCoachingColumnError(error.message)) {
    ({ data, error } = await supabase
      .from('coaching_sessions')
      .select(COACHING_SESSION_COLUMNS_LEGACY)
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })
      .limit(limit));
  }

  if (error) {
    console.warn('[coachingSessions] fetch failed:', error.message);
    return [];
  }

  return data ?? [];
}
