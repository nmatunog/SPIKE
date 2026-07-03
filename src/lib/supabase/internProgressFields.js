/** Progressive select lists — tolerate pre-migration databases. */

export const INTERN_PROGRESS_SELECT_BASE =
  'segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id';

export const INTERN_PROGRESS_SELECT_PROGRAM = `${INTERN_PROGRESS_SELECT_BASE}, program_slug, ra_spike_segment, ra_spike_current_week, gate_1_status, gate_1_score, gate_1_evaluated_at, gate_2_status, gate_2_score, gate_2_evaluated_at, graduated_at, home_unit`;

/** @param {{ code?: string, message?: string }} error */
export function isMissingInternProgressColumnError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return error.code === '42703' || /column .* does not exist|schema cache/i.test(message);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} userId
 */
export async function fetchInternProgressRow(client, userId) {
  const selects = [INTERN_PROGRESS_SELECT_PROGRAM, INTERN_PROGRESS_SELECT_BASE];
  for (const select of selects) {
    const { data, error } = await client
      .from('intern_progress')
      .select(select)
      .eq('user_id', userId)
      .maybeSingle();
    if (!error) return data;
    if (!isMissingInternProgressColumnError(error)) throw error;
  }
  return null;
}
