import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import {
  canWriteParticipantRow,
  isMissingSchemaError,
  shouldSkipSupabaseUserWrite,
} from './writeGuards.js';

const SURVEY_RESPONSES_TABLE_MISSING_KEY = 'spike_survey_responses_table_missing';

function surveyResponsesTableMissing() {
  try {
    return sessionStorage.getItem(SURVEY_RESPONSES_TABLE_MISSING_KEY) === '1';
  } catch {
    return false;
  }
}

function markSurveyResponsesTableMissing() {
  try {
    sessionStorage.setItem(SURVEY_RESPONSES_TABLE_MISSING_KEY, '1');
  } catch {
    /* private mode */
  }
}

/**
 * @param {string} userId
 * @param {string} surveyId
 * @param {string} [dayId]
 * @param {Array<{ questionId: string, value: unknown }>} answers
 */
export async function upsertSurveyResponse(userId, surveyId, dayId, answers) {
  if (
    !isSupabaseConfigured
    || !supabase
    || surveyResponsesTableMissing()
    || !(await canWriteParticipantRow(userId))
  ) {
    return null;
  }

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
    if (isMissingSchemaError(responseErr)) {
      markSurveyResponsesTableMissing();
      return null;
    }
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
    if (isMissingSchemaError(answersErr)) {
      markSurveyResponsesTableMissing();
      return null;
    }
    console.warn('[surveyResponses] answers upsert failed:', answersErr.message);
    return null;
  }

  return responseRow.id;
}

/** @param {string} userId */
export async function fetchAllSurveyResponses(userId) {
  if (
    !isSupabaseConfigured
    || !supabase
    || shouldSkipSupabaseUserWrite(userId)
    || surveyResponsesTableMissing()
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from('survey_responses')
    .select('survey_id, day_id, submitted_at, survey_response_answers(question_id, answer)')
    .eq('user_id', userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      markSurveyResponsesTableMissing();
      return [];
    }
    console.warn('[surveyResponses] fetch all failed:', error.message);
    return [];
  }

  return data ?? [];
}

/** @param {string} userId @param {string} surveyId */
export async function fetchSurveyResponse(userId, surveyId) {
  if (
    !isSupabaseConfigured
    || !supabase
    || shouldSkipSupabaseUserWrite(userId)
    || surveyResponsesTableMissing()
  ) {
    return null;
  }

  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, survey_id, day_id, submitted_at, survey_response_answers(question_id, answer)')
    .eq('user_id', userId)
    .eq('survey_id', surveyId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) {
      markSurveyResponsesTableMissing();
      return null;
    }
    console.warn('[surveyResponses] fetch failed:', error.message);
    return null;
  }

  return data;
}
