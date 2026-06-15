/** SPIKE cohort timezone — activation codes roll at midnight Manila. */
export const ACTIVATION_TIMEZONE = 'Asia/Manila';

/** @param {Date} [date] */
export function getActivationDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ACTIVATION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} inputCode
 */
export async function validateInternActivationCode(admin, inputCode) {
  const todayKey = getActivationDateKey();
  const { data: codeRow, error } = await admin
    .from('activation_codes')
    .select('code, expires_at')
    .eq('date_key', todayKey)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!codeRow) throw new Error('No activation code is available for today.');
  if (new Date(codeRow.expires_at).getTime() < Date.now()) {
    throw new Error('Activation code has expired. Ask staff for today\'s code.');
  }
  if (String(codeRow.code).toUpperCase() !== String(inputCode).trim().toUpperCase()) {
    throw new Error('Invalid activation code.');
  }
}
