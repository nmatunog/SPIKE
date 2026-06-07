import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} squadId
 * @param {string} surveyId
 */
export async function fetchResearchAnalytics(squadId, surveyId) {
  if (!isSupabaseConfigured || !supabase || !squadId || !surveyId) return null;

  const { data, error } = await supabase
    .from('research_analytics')
    .select('squad_id, survey_id, response_count, metrics, updated_at')
    .eq('squad_id', squadId)
    .eq('survey_id', surveyId)
    .maybeSingle();

  if (error) {
    console.warn('[researchAnalytics] fetch failed:', error.message);
    return null;
  }

  return data;
}

/**
 * @param {string} squadId
 * @param {string} surveyId
 * @param {number} responseCount
 * @param {object} metrics
 */
export async function upsertResearchAnalytics(squadId, surveyId, responseCount, metrics) {
  if (!isSupabaseConfigured || !supabase || !squadId || !surveyId) return null;

  const { data, error } = await supabase
    .from('research_analytics')
    .upsert(
      {
        squad_id: squadId,
        survey_id: surveyId,
        response_count: responseCount,
        metrics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'squad_id,survey_id' },
    )
    .select('squad_id, survey_id, response_count, metrics, updated_at')
    .single();

  if (error) {
    console.warn('[researchAnalytics] upsert failed:', error.message);
    return null;
  }

  return data;
}
