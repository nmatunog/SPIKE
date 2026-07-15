import { apiFetch } from '../apiClient.js';
import { isRaSpikePortalContext, raSpikeApiFetch } from './raSpikeApiClient.js';
import { supabase } from '../supabaseClient.js';

const HANDOFF_PARAM = 'portal_handoff';

function handoffApiFetch(body, accessToken) {
  const opts = {
    method: 'POST',
    body,
    token: accessToken,
  };
  return isRaSpikePortalContext()
    ? raSpikeApiFetch('/ra-spike/staff-portal-handoff', opts)
    : apiFetch('/api/auth/staff-portal-handoff', opts);
}

/** Strip consumed handoff query param without a navigation. */
export function clearPortalHandoffParam() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(HANDOFF_PARAM)) return;
  url.searchParams.delete(HANDOFF_PARAM);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
}

/** @returns {string | null} */
export function readPortalHandoffToken() {
  if (typeof window === 'undefined') return null;
  return new URL(window.location.href).searchParams.get(HANDOFF_PARAM);
}

/**
 * Exchange a signed handoff token for a Supabase session on this portal.
 * @param {string} token
 */
export async function consumeStaffPortalHandoff(token) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const data = isRaSpikePortalContext()
    ? await raSpikeApiFetch('/ra-spike/staff-portal-handoff', {
        method: 'POST',
        body: { action: 'consume', token },
      })
    : await apiFetch('/api/auth/staff-portal-handoff', {
        method: 'POST',
        body: { action: 'consume', token },
      });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: 'email',
  });
  if (error) throw error;
  clearPortalHandoffParam();
}

/**
 * @param {'internship' | 'ra-spike'} targetPortal
 * @param {string} redirectPath
 */
export async function navigateWithStaffPortalHandoff(targetPortal, redirectPath) {
  const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
  const label = targetPortal === 'internship' ? 'SPIKE Internship' : 'RA-SPIKE';

  if (!supabase) {
    throw new Error(`Sign in again, then switch to ${label}.`);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error(`Your session expired. Sign in again, then switch to ${label}.`);
  }

  let data;
  try {
    data = await handoffApiFetch({ action: 'create', target: targetPortal }, accessToken);
  } catch (err) {
    const detail = err?.message ? ` ${err.message}` : '';
    throw new Error(`Could not switch to ${label}.${detail}`);
  }

  if (!data?.token) {
    throw new Error(`Could not switch to ${label}. Handoff token missing.`);
  }

  const url = new URL(path, window.location.origin);
  url.searchParams.set(HANDOFF_PARAM, data.token);
  window.location.href = url.toString();
}
