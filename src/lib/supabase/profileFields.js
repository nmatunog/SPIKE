/** Progressive profile selects — tolerate pre-migration databases. */

export const PROFILE_SELECT_BASE = 'id, email, name, role, read_only';

export const PROFILE_SELECT_EXTENDED = `${PROFILE_SELECT_BASE}, mobile, avatar_url`;

/** @param {{ code?: string, message?: string }} error */
export function isMissingProfileColumnError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return error.code === '42703' || /column .* does not exist|schema cache/i.test(message);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} userId
 */
export async function fetchProfileRow(client, userId) {
  const selects = [PROFILE_SELECT_EXTENDED, PROFILE_SELECT_BASE];
  for (const select of selects) {
    const { data, error } = await client
      .from('profiles')
      .select(select)
      .eq('id', userId)
      .maybeSingle();
    if (!error) return data;
    if (!isMissingProfileColumnError(error)) throw error;
  }
  return null;
}
