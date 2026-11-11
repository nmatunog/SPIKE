import { RATE_LIMIT_MAX_FAILURES, RATE_LIMIT_WINDOW_MS, REASONS } from './constants.js';

function isMissingRelation(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST202' ||
    /schema cache|does not exist|42P01/i.test(error.message || '')
  );
}

/**
 * Durable rate limit keyed by authenticated user id or client IP.
 * Fail CLOSED when versa_rate_limits (or the increment RPC) is missing.
 *
 * @param {{
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   key: string,
 *   now?: number,
 *   windowMs?: number,
 *   maxFailures?: number,
 * }} input
 */
export async function assertDurableRateLimit(input) {
  const now = input.now ?? Date.now();
  const windowMs = input.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const maxFailures = input.maxFailures ?? RATE_LIMIT_MAX_FAILURES;
  const { data: row, error } = await input.admin
    .from('versa_rate_limits')
    .select('rate_key, fail_count, window_start')
    .eq('rate_key', input.key)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) {
      return { ok: false, reason: REASONS.rate_limited, missingTable: true };
    }
    throw new Error(error.message);
  }
  if (!row) return { ok: true };
  const start = new Date(row.window_start).getTime();
  if (!Number.isFinite(start) || now - start > windowMs) return { ok: true };
  if (Number(row.fail_count) >= maxFailures) {
    return { ok: false, reason: REASONS.rate_limited };
  }
  return { ok: true };
}

/**
 * Atomic increment: RPC `versa_rate_limit_record_fail` or
 * `UPDATE ... SET fail_count = fail_count + 1`. Fail closed if the table is gone.
 *
 * @param {{
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   key: string,
 *   now?: number,
 *   windowMs?: number,
 * }} input
 */
export async function recordDurableFail(input) {
  const now = input.now ?? Date.now();
  const windowMs = input.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const iso = new Date(now).toISOString();

  const rpc = await input.admin.rpc('versa_rate_limit_record_fail', {
    p_rate_key: input.key,
    p_window_ms: windowMs,
  });
  if (!rpc.error) return;
  if (isMissingRelation(rpc.error) && /versa_rate_limits/i.test(rpc.error.message || '')) {
    throw new Error('versa_rate_limits is missing; rate limit fail-closed.');
  }

  const missingRpc =
    rpc.error.code === 'PGRST202' ||
    /could not find the function|schema cache|does not exist/i.test(rpc.error.message || '');
  if (!missingRpc) throw new Error(rpc.error.message);

  const { data: row, error: readErr } = await input.admin
    .from('versa_rate_limits')
    .select('rate_key, fail_count, window_start')
    .eq('rate_key', input.key)
    .maybeSingle();
  if (readErr) {
    if (isMissingRelation(readErr)) {
      throw new Error('versa_rate_limits is missing; rate limit fail-closed.');
    }
    throw new Error(readErr.message);
  }

  const start = row ? new Date(row.window_start).getTime() : 0;
  if (!row || !Number.isFinite(start) || now - start > windowMs) {
    const { error } = await input.admin.from('versa_rate_limits').upsert(
      { rate_key: input.key, fail_count: 1, window_start: iso },
      { onConflict: 'rate_key' },
    );
    if (error) {
      if (isMissingRelation(error)) {
        throw new Error('versa_rate_limits is missing; rate limit fail-closed.');
      }
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await input.admin
    .from('versa_rate_limits')
    .update({ fail_count: Number(row.fail_count) + 1 })
    .eq('rate_key', input.key);
  if (error) {
    if (isMissingRelation(error)) {
      throw new Error('versa_rate_limits is missing; rate limit fail-closed.');
    }
    throw new Error(error.message);
  }
}

/**
 * @param {Request | null | undefined} request
 * @param {{ userId?: string | null }} identity
 */
export function rateLimitKey(request, identity) {
  if (identity?.userId) return `user:${identity.userId}`;
  const ip =
    request?.headers?.get('CF-Connecting-IP') ||
    request?.headers?.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
  return `ip:${ip}`;
}

/** @deprecated in-memory store removed; kept as no-op for old tests */
export function resetVersaRateLimitStore() {}
export const versaRateLimitStore = new Map();
