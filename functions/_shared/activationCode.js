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
 * Constant-time compare of intern activation codes (case-insensitive).
 * Length is mixed into the accumulator so padding cannot collapse mismatches.
 * @param {unknown} left
 * @param {unknown} right
 */
export function codesEqual(left, right) {
  const a = String(left ?? '').trim().toUpperCase();
  const b = String(right ?? '').trim().toUpperCase();
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
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
  if (!codesEqual(codeRow.code, inputCode)) {
    throw new Error('Invalid activation code.');
  }
}
