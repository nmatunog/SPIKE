import { supabase } from '../supabaseClient.js';

export async function ensureStaffRegistrationCode() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('ensure_staff_registration_code');
  if (error) throw error;
  return data ?? null;
}

export async function regenerateStaffRegistrationCode() {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('regenerate_staff_registration_code');
  if (error) throw error;
  return data ?? null;
}

export async function loadStaffRegistrationCode() {
  if (!supabase) return null;
  await ensureStaffRegistrationCode().catch(() => null);
  const { data, error } = await supabase
    .from('staff_registration_config')
    .select('code, expires_at, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** @param {string} inputCode */
export async function validateStaffRegistrationCode(inputCode) {
  if (!supabase) throw new Error('Signup is only available in Supabase mode.');
  const { error } = await supabase.rpc('validate_staff_registration_code', {
    p_code: inputCode,
  });
  if (error) throw error;
}
