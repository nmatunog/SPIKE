import { supabase } from '../supabaseClient.js';

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

/** @returns {Promise<{ date_key: string, code: string, expires_at: string, generated_at: string } | null>} */
export async function ensureDailyActivationCode() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('ensure_daily_activation_code');
  if (error) throw error;
  return data ?? null;
}

/** @returns {Promise<{ date_key: string, code: string, expires_at: string, generated_at: string } | null>} */
export async function fetchTodayActivationCode() {
  if (!supabase) return null;
  const todayKey = getActivationDateKey();
  const { data, error } = await supabase
    .from('activation_codes')
    .select('date_key, code, expires_at, generated_at')
    .eq('date_key', todayKey)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Admin-only: replace today's code. @returns {Promise<object | null>} */
export async function regenerateDailyActivationCode() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('regenerate_daily_activation_code');
  if (error) throw error;
  return data ?? null;
}

/** Ensure today's code exists, then return it. */
export async function loadStaffActivationCode() {
  await ensureDailyActivationCode();
  return fetchTodayActivationCode();
}

/** @param {string} inputCode */
export async function validateInternActivationCode(inputCode) {
  if (!supabase) throw new Error('Signup is only available in Supabase mode.');
  const todayKey = getActivationDateKey();
  const { data: codeRow, error } = await supabase
    .from('activation_codes')
    .select('code, expires_at')
    .eq('date_key', todayKey)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!codeRow) throw new Error('No activation code is available for today.');
  if (new Date(codeRow.expires_at).getTime() < Date.now()) {
    throw new Error('Activation code has expired. Ask staff for today\'s code.');
  }
  if (String(codeRow.code).toUpperCase() !== String(inputCode).toUpperCase()) {
    throw new Error('Invalid activation code.');
  }
}
