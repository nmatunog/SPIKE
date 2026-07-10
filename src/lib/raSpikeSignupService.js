import { ApiError, apiFetch } from '../apiClient.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

/**
 * @param {{
 *   name: string,
 *   mobile: string,
 *   email: string,
 *   password: string,
 *   batchInviteCode?: string,
 *   cohortId?: number,
 *   homeAgency: string,
 *   homeUnit: string,
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
      // Open enrollment — never send invite code or cohort picker.
      homeAgency: payload.homeAgency.trim(),
      homeUnit: payload.homeUnit.trim(),
    },
  });
}

export async function fetchRaSpikeEnrollmentOptions() {
  return apiFetch('/api/auth/ra-spike-enrollment-options', { method: 'GET' });
}

/** @returns {Promise<string | null>} */
async function resolveSupabaseAccessToken(explicitToken) {
  if (explicitToken) return explicitToken;
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * @param {string | null | undefined} token
 * @param {{ avatarUrl?: string, skipPhoto?: boolean }} payload
 */
export async function completeRaSpikeOnboarding(token, payload = {}) {
  const accessToken = await resolveSupabaseAccessToken(token);
  if (!accessToken) {
    throw new Error('Sign in required.');
  }
  return apiFetch('/api/auth/ra-spike-complete-onboarding', {
    method: 'POST',
    token: accessToken,
    body: payload,
  });
}

/** @param {unknown} err */
export function isRaSpikeSignupApiUnavailable(err) {
  if (!(err instanceof ApiError)) return false;
  const msg = String(err.message || '');
  return err.status === 503 || msg.includes('MISSING_SERVICE_KEY') || msg.includes('not configured');
}
