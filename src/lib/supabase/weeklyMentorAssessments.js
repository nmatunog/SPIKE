import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{ week: number, scores: Record<string, number>, notes?: string, recommendation?: string }} entry
 */
export async function createWeeklyMentorAssessment(mentorId, participantId, entry) {
  if (!isSupabaseConfigured || !supabase || !mentorId || !participantId) return null;

  const { data, error } = await supabase
    .from('weekly_mentor_assessments')
    .upsert(
      {
        mentor_id: mentorId,
        participant_id: participantId,
        week: entry.week,
        scores: entry.scores,
        notes: entry.notes || null,
        recommendation: entry.recommendation ?? 'continue_normally',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'participant_id,week' },
    )
    .select('id')
    .single();

  if (error) {
    if (/weekly_mentor_assessments|schema cache|does not exist/i.test(error.message ?? '')) {
      return null;
    }
    console.warn('[weeklyMentorAssessments] upsert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * @param {string} participantId
 * @param {number} [week]
 */
export async function fetchWeeklyMentorAssessment(participantId, week = 1) {
  if (!isSupabaseConfigured || !supabase || !participantId) return null;

  const { data, error } = await supabase
    .from('weekly_mentor_assessments')
    .select('id, mentor_id, participant_id, week, scores, notes, recommendation, created_at, updated_at')
    .eq('participant_id', participantId)
    .eq('week', week)
    .maybeSingle();

  if (error) {
    if (/weekly_mentor_assessments|schema cache|does not exist/i.test(error.message ?? '')) {
      return null;
    }
    console.warn('[weeklyMentorAssessments] fetch failed:', error.message);
    return null;
  }

  return data;
}
