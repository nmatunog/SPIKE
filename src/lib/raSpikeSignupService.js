import { ApiError, apiFetch } from '../apiClient.js';

/**
 * @param {{
 *   name: string,
 *   mobile: string,
 *   email: string,
 *   password: string,
 *   batchInviteCode?: string,
 *   cohortId?: number,
 * }} payload
 */
export async function registerRaSpikeViaApi(payload) {
  return apiFetch('/api/auth/ra-spike-signup', {
    method: 'POST',
    body: {
      name: payload.name.trim(),
      mobile: payload.mobile.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      batchInviteCode: payload.batchInviteCode?.trim() || undefined,
      cohortId: payload.cohortId,
    },
  });
}

export async function fetchRaSpikeEnrollmentOptions() {
  return apiFetch('/api/auth/ra-spike-enrollment-options', { method: 'GET' });
}

/**
 * @param {string} token
 * @param {{ avatarUrl?: string, skipPhoto?: boolean }} payload
 */
export async function completeRaSpikeOnboarding(token, payload = {}) {
  return apiFetch('/api/auth/ra-spike-complete-onboarding', {
    method: 'POST',
    token,
    body: payload,
  });
}

/** @param {unknown} err */
export function isRaSpikeSignupApiUnavailable(err) {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message || '');
  return err.status === 503 || msg.includes('MISSING_SERVICE_KEY') || msg.includes('not configured');
}
