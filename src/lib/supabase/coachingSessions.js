import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const MAX_TOPIC = 200;
const MAX_NOTES = 4000;

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{ topic: string, notes: string, week?: number, day?: number, discussionSummary?: string, strengths?: string, growthAreas?: string, concernFlagged?: boolean, followUpDate?: string, actionItems?: string[] }} input
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
      follow_up_date: input.followUpDate ?? null,
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
