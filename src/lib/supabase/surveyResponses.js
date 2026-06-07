import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {string} surveyId
 * @param {string} [dayId]
 * @param {Array<{ questionId: string, value: unknown }>} answers
 */
export async function upsertSurveyResponse(userId, surveyId, dayId, answers) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data: responseRow, error: responseErr } = await supabase
    .from('survey_responses')
    .upsert(
      {
        user_id: userId,
        survey_id: surveyId,
        day_id: dayId ?? null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,survey_id' },
    )
    .select('id')
    .single();

  if (responseErr || !responseRow?.id) {
    console.warn('[surveyResponses] response upsert failed:', responseErr?.message);
    return null;
  }

  const answerRows = answers.map((a) => ({
    response_id: responseRow.id,
    question_id: a.questionId,
    answer: a.value,
  }));

  const { error: answersErr } = await supabase
    .from('survey_response_answers')
    .upsert(answerRows, { onConflict: 'response_id,question_id' });

  if (answersErr) {
    console.warn('[surveyResponses] answers upsert failed:', answersErr.message);
    return null;
  }

  return responseRow.id;
}

/** @param {string} userId @param {string} surveyId */
export async function fetchSurveyResponse(userId, surveyId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, survey_id, day_id, submitted_at, survey_response_answers(question_id, answer)')
    .eq('user_id', userId)
    .eq('survey_id', surveyId)
    .maybeSingle();

  if (error) {
    console.warn('[surveyResponses] fetch failed:', error.message);
    return null;
  }

  return data;
}
