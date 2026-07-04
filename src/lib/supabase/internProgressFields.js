/** Progressive select lists — tolerate pre-migration / RA-SPIKE databases. */

export const INTERN_PROGRESS_SELECT_PROGRAM =
  'segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id, program_slug, ra_spike_segment, ra_spike_current_week, gate_1_status, gate_1_score, gate_1_evaluated_at, gate_2_status, gate_2_score, gate_2_evaluated_at, graduated_at, home_unit';

export const INTERN_PROGRESS_SELECT_RA_SPIKE =
  'segment, hours, licensed, squad, university, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id, program_slug, ra_spike_segment, ra_spike_current_week, gate_1_status, gate_1_score, gate_1_evaluated_at, gate_2_status, gate_2_score, gate_2_evaluated_at, graduated_at, home_unit';

export const INTERN_PROGRESS_SELECT_ONBOARDING =
  'segment, hours, licensed, squad, university, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id, program_slug, ra_spike_segment, ra_spike_current_week, home_unit';

export const INTERN_PROGRESS_SELECT_BASE =
  'segment, hours, licensed, squad, university, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id';

export const INTERN_PROGRESS_SELECT_MINIMAL =
  'segment, hours, licensed, squad, university, cohort_id, program_slug, ra_spike_segment, ra_spike_current_week';

export const INTERN_PROGRESS_SELECT_CORE =
  'segment, hours, licensed, squad, university';

/** @param {{ code?: string, message?: string, details?: string, hint?: string } | null | undefined} error */
export function isMissingInternProgressColumnError(error) {
  if (!error) return false;
  const message = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`;
  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || /column .* does not exist|schema cache|could not find .* column/i.test(message)
  );
}

function isRaSpikeClientBuild() {
  return String(import.meta.env.BASE_URL || '').includes('ra-spike');
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} userId
 */
export async function fetchInternProgressRow(client, userId) {
  if (!client || !userId) return null;

  // RA-SPIKE DB omits internship-only columns (e.g. career_track) — try those selects first.
  const selects = isRaSpikeClientBuild()
    ? [
      INTERN_PROGRESS_SELECT_RA_SPIKE,
      INTERN_PROGRESS_SELECT_ONBOARDING,
      INTERN_PROGRESS_SELECT_MINIMAL,
      INTERN_PROGRESS_SELECT_CORE,
    ]
    : [
      INTERN_PROGRESS_SELECT_PROGRAM,
      INTERN_PROGRESS_SELECT_RA_SPIKE,
      INTERN_PROGRESS_SELECT_ONBOARDING,
      INTERN_PROGRESS_SELECT_BASE,
      INTERN_PROGRESS_SELECT_MINIMAL,
      INTERN_PROGRESS_SELECT_CORE,
    ];

  for (const select of selects) {
    const { data, error } = await client
      .from('intern_progress')
      .select(select)
      .eq('user_id', userId)
      .maybeSingle();
    if (!error) return data;
    if (!isMissingInternProgressColumnError(error)) {
      // Invalid uuid / RLS / network — do not spam retries; return null for staff previews.
      console.warn('[intern_progress]', error.message ?? error);
      return null;
    }
  }
  return null;
}
