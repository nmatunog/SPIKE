/** Durable intern-signup attempt limit, modeled on versa_rate_limits. */

export const INTERN_SIGNUP_RATE_WINDOW_MS = 10 * 60 * 1000;
export const INTERN_SIGNUP_RATE_MAX = 8;
export const INTERN_SIGNUP_RATE_LIMITED_MESSAGE = 'Too many attempts. Try again later.';

function isMissingRelationOrRpc(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST202' ||
    /schema cache|does not exist|could not find the function|42P01/i.test(error.message || '')
  );
}

/**
 * @param {Request | null | undefined} request
 */
export function internSignupRateKey(request) {
  const ip =
    request?.headers?.get('CF-Connecting-IP') ||
    request?.headers?.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * Fail closed when intern_signup_rate_limits is missing.
 * @param {{
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   key: string,
 *   now?: number,
 *   windowMs?: number,
 *   maxFailures?: number,
 * }} input
 */
export async function assertInternSignupRateLimit(input) {
  const now = input.now ?? Date.now();
  const windowMs = input.windowMs ?? INTERN_SIGNUP_RATE_WINDOW_MS;
  const maxFailures = input.maxFailures ?? INTERN_SIGNUP_RATE_MAX;
  const { data: row, error } = await input.admin
    .from('intern_signup_rate_limits')
    .select('rate_key, fail_count, window_start')
    .eq('rate_key', input.key)
    .maybeSingle();
  if (error) {
    if (isMissingRelationOrRpc(error)) {
      return { ok: false, missingTable: true };
    }
    throw new Error(error.message);
  }
  if (!row) return { ok: true };
  const start = new Date(row.window_start).getTime();
  if (!Number.isFinite(start) || now - start > windowMs) return { ok: true };
  if (Number(row.fail_count) >= maxFailures) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Atomic increment via RPC only. Missing RPC/table fails closed.
 * @param {{
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   key: string,
 *   windowMs?: number,
 * }} input
 */
export async function recordInternSignupFail(input) {
  const windowMs = input.windowMs ?? INTERN_SIGNUP_RATE_WINDOW_MS;
  const rpc = await input.admin.rpc('intern_signup_rate_limit_record_fail', {
    p_rate_key: input.key,
    p_window_ms: windowMs,
  });
  if (!rpc.error) return;
  if (isMissingRelationOrRpc(rpc.error)) {
    throw new Error('intern_signup_rate_limit_record_fail is missing; rate limit fail-closed.');
  }
  throw new Error(rpc.error.message);
}
