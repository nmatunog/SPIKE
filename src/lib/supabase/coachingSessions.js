import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const MAX_TOPIC = 200;
const MAX_NOTES = 4000;

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{ topic: string, notes: string }} input
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
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[coachingSessions] insert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}
