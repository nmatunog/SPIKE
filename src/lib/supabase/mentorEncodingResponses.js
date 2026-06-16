import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { isMissingSchemaError } from './writeGuards.js';

const MENTOR_ENCODING_TABLE_MISSING_KEY = 'spike_mentor_encoding_table_missing';

function mentorEncodingTableMissing() {
  try {
    return sessionStorage.getItem(MENTOR_ENCODING_TABLE_MISSING_KEY) === '1';
  } catch {
    return false;
  }
}

function markMentorEncodingTableMissing() {
  try {
    sessionStorage.setItem(MENTOR_ENCODING_TABLE_MISSING_KEY, '1');
  } catch {
    /* private mode */
  }
}

/**
 * @param {string} staffId
 * @param {{
 *   participantId?: string | null,
 *   week: number,
 *   day: number,
 *   formType: string,
 *   templateId: string,
 *   answers: Record<string, unknown>,
 * }} entry
 */
export async function upsertMentorEncodingResponse(staffId, entry) {
  if (!isSupabaseConfigured || !supabase || !staffId || mentorEncodingTableMissing()) return null;

  const existing = await fetchMentorEncodingResponse(
    staffId,
    entry.participantId,
    entry.week,
    entry.day,
    entry.formType,
  );

  const row = {
    staff_id: staffId,
    participant_id: entry.participantId ?? null,
    week: entry.week,
    day: entry.day,
    form_type: entry.formType,
    template_id: entry.templateId,
    answers: entry.answers,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('mentor_encoding_responses')
      .update(row)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) {
      if (isMissingSchemaError(error)) {
        markMentorEncodingTableMissing();
        return null;
      }
      console.warn('[mentorEncodingResponses] update failed:', error.message);
      return null;
    }
    return data?.id ?? null;
  }

  const { data, error } = await supabase
    .from('mentor_encoding_responses')
    .insert(row)
    .select('id')
    .single();
  if (error) {
    if (isMissingSchemaError(error)) {
      markMentorEncodingTableMissing();
      return null;
    }
    console.warn('[mentorEncodingResponses] insert failed:', error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * @param {string} staffId
 * @param {string | null | undefined} participantId
 * @param {number} week
 * @param {number} day
 * @param {string} formType
 */
export async function fetchMentorEncodingResponse(staffId, participantId, week, day, formType) {
  if (!isSupabaseConfigured || !supabase || !staffId || mentorEncodingTableMissing()) return null;

  let query = supabase
    .from('mentor_encoding_responses')
    .select('id, staff_id, participant_id, week, day, form_type, template_id, answers, updated_at')
    .eq('staff_id', staffId)
    .eq('week', week)
    .eq('day', day)
    .eq('form_type', formType);

  if (participantId) {
    query = query.eq('participant_id', participantId);
  } else {
    query = query.is('participant_id', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    if (isMissingSchemaError(error)) {
      markMentorEncodingTableMissing();
      return null;
    }
    console.warn('[mentorEncodingResponses] fetch failed:', error.message);
    return null;
  }
  return data;
}
