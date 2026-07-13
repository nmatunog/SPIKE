import { apiFetch } from '../apiClient.js';
import { isRaSpikePortalContext, raSpikeApiFetch } from './raSpikeApiClient.js';

/** @param {unknown} err */
export function isInvalidLoginCredentials(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('invalid login') || msg.includes('invalid_credentials');
}

/**
 * @param {string} email
 * @returns {Promise<'ra-spike' | 'internship' | 'both' | 'unknown' | null>}
 */
export async function fetchPortalAuthHint(email) {
  const body = { email: String(email || '').trim().toLowerCase() };
  if (!body.email.includes('@')) return null;

  try {
    const data = isRaSpikePortalContext()
      ? await raSpikeApiFetch('/ra-spike/portal-hint', { method: 'POST', body })
      : await apiFetch('/api/auth/portal-hint', { method: 'POST', body });
    const portal = data?.portal;
    if (portal === 'ra-spike' || portal === 'internship' || portal === 'both' || portal === 'unknown') {
      return portal;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * On wrong-portal login, redirect to the correct app entry (no cross-promo UI).
 * @param {'internship' | 'ra-spike'} currentPortal
 * @param {'ra-spike' | 'internship' | 'both' | 'unknown' | null} hint
 * @returns {string | null}
 */
export function portalRedirectForHint(currentPortal, hint) {
  if (hint === 'both') return null;
  if (hint === 'ra-spike' && currentPortal === 'internship') return '/ra-spike/';
  if (hint === 'internship' && currentPortal === 'ra-spike') return '/';
  return null;
}

/**
 * @param {{
 *   email: string,
 *   password: string,
 *   login: (email: string, password: string) => Promise<unknown>,
 *   currentPortal: 'internship' | 'ra-spike',
 * }} opts
 */
export async function loginWithPortalRouting({ email, password, login, currentPortal }) {
  try {
    return await login(email, password);
  } catch (err) {
    if (!isInvalidLoginCredentials(err)) throw err;
    const hint = await fetchPortalAuthHint(email);
    const redirectTo = portalRedirectForHint(currentPortal, hint);
    if (redirectTo) {
      window.location.replace(redirectTo);
      return null;
    }
    throw err;
  }
}
