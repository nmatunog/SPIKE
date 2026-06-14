import { apiFetch, apiUrl } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

async function getAccessToken() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session expired. Sign in again.');
  return token;
}

export async function fetchAllUsersForSuperuser() {
  const token = await getAccessToken();
  const data = await apiFetch('/api/admin/users', { token });
  return data?.users ?? [];
}

/**
 * @param {{
 *   action: 'promote' | 'edit' | 'password_reset' | 'delete',
 *   targetId: string,
 *   reason: string,
 *   role?: string,
 *   name?: string,
 *   email?: string,
 *   confirmEmail?: string,
 * }} payload
 */
export async function runSuperuserUserAction(payload) {
  const token = await getAccessToken();
  return apiFetch('/api/admin/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function userAdminApiAvailable() {
  return Boolean(supabase);
}

export { apiUrl };
