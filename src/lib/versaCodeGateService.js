import { apiFetch } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

export const VERSA_GENERIC_DENY =
  "We couldn't verify this code for your account. Check the code or use the enrollment help link.";

export const VERSA_HELP_PLACEHOLDER =
  'Access codes are issued through the SPIKE–Versa enrollment process. Delivery channel is pending the co-branded enrollment page.';

export async function fetchVersaGateStatus() {
  try {
    return await apiFetch('/api/versa/status', { method: 'GET' });
  } catch {
    return { enabled: false };
  }
}

async function bearerToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function redeemVersaAccessCode(code) {
  const token = await bearerToken();
  if (!token) {
    throw new Error('Sign in or create your account, then verify your access code.');
  }
  return apiFetch('/api/versa/redeem', {
    method: 'POST',
    token,
    body: { code: String(code || '').trim() },
  });
}

export async function fetchVersaAccess() {
  const token = await bearerToken();
  if (!token) return { enabled: false, entitlements: [] };
  return apiFetch('/api/versa/access', { method: 'GET', token });
}
