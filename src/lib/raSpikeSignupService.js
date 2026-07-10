import { ApiError } from '../apiClient.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { raSpikeApiFetch } from './raSpikeApiClient.js';

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
  return raSpikeApiFetch('/ra-spike/signup', {
    method: 'POST',
    body: {
      name: payload.name.trim(),
      mobile: payload.mobile.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      homeAgency: payload.homeAgency.trim(),
      homeUnit: payload.homeUnit.trim(),
    },
  });
}

export async function fetchRaSpikeEnrollmentOptions() {
  return raSpikeApiFetch('/ra-spike/enrollment-options', { method: 'GET' });
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
  return raSpikeApiFetch('/ra-spike/complete-onboarding', {
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
