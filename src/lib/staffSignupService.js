import { ApiError, apiFetch } from '../apiClient.js';

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   role: string,
 *   code?: string,
 * }} payload
 */
export async function registerStaffViaApi(payload) {
  return apiFetch('/api/auth/staff-signup', {
    method: 'POST',
    body: {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: String(payload.role).trim().toUpperCase(),
      code: payload.code?.trim() || undefined,
    },
  });
}

/** @param {unknown} err */
export function isStaffSignupApiUnavailable(err) {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message || '');
  return err.status === 503 || msg.includes('MISSING_SERVICE_KEY') || msg.includes('not configured');
}
