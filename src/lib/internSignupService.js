import { ApiError, apiFetch } from '../apiClient.js';

/**
 * Register an intern without sending a Supabase confirmation email.
 * Requires SUPABASE_SERVICE_ROLE_KEY on Cloudflare Pages.
 *
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   code: string,
 *   university?: string,
 *   squad?: string,
 * }} payload
 */
export async function registerInternViaApi(payload) {
  return apiFetch('/api/auth/intern-signup', {
    method: 'POST',
    body: {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      code: payload.code.trim(),
      university: payload.university?.trim() || undefined,
      squad: payload.squad?.trim() || undefined,
    },
  });
}

/** @param {unknown} err */
export function isInternSignupApiUnavailable(err) {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message || '');
  return err.status === 503 || msg.includes('MISSING_SERVICE_KEY') || msg.includes('not configured');
}
