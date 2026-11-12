/** Durable intern-signup attempt limit, modeled on versa_rate_limits. */

export const INTERN_SIGNUP_RATE_WINDOW_MS = 10 * 60 * 1000;
/** Classroom-safe shared-IP cap (one NAT / wifi). Config via INTERN_SIGNUP_RATE_MAX. */
export const INTERN_SIGNUP_RATE_MAX_DEFAULT = 20;
export const INTERN_SIGNUP_RATE_MAX_ENV = 'INTERN_SIGNUP_RATE_MAX';
export const INTERN_SIGNUP_RATE_LIMITED_MESSAGE = 'Too many attempts. Try again later.';

const FAILED_CODE_RE =
  /invalid activation code|activation code has expired|no activation code is available/i;

export function internSignupRateMax(env = {}) {
  const raw = env?.[INTERN_SIGNUP_RATE_MAX_ENV];
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return INTERN_SIGNUP_RATE_MAX_DEFAULT;
}

export function isFailedActivationCode(message) {
  return FAILED_CODE_RE.test(String(message || ''));
}

export const INTERN_SIGNUP_UNAVAILABLE_MESSAGE =
  'Signup is temporarily unavailable. Try again later.';

function isMissingRelationOrRpc(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '');
  if (code === '42P01' || code === '42883' || code === 'PGRST202') return true;
  return (
    /relation ['"]?\S+['"]? does not exist/i.test(msg) ||
    /could not find the function/i.test(msg) ||
    /function .+ does not exist/i.test(msg)
  );
}

function warnFailOpen(detail) {
  console.error(
    `INTERN SIGNUP RATE LIMIT UNAVAILABLE: ${detail}; allowing signup (fail open).`,
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

function parseBeginResult(data) {
  let row = data;
  if (typeof row === 'string') {
    try {
      row = JSON.parse(row);
    } catch {
      row = null;
    }
  }
  if (Array.isArray(row)) row = row[0];
  return {
    allowed: row?.allowed !== false,
    fail_count: Number(row?.fail_count) || 0,
  };
}

/**
 * Atomically check-and-increment before validating the code.
 * Missing table/function fails OPEN (log a loud warning; do not 429).
 * Any other rpc.error fails CLOSED (generic 503).
 * @param {{
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   key: string,
 *   windowMs?: number,
 *   maxFailures?: number,
 * }} input
 */
export async function beginInternSignupAttempt(input) {
  const windowMs = input.windowMs ?? INTERN_SIGNUP_RATE_WINDOW_MS;
  const maxFailures = input.maxFailures ?? INTERN_SIGNUP_RATE_MAX_DEFAULT;
  const rpc = await input.admin.rpc('intern_signup_rate_limit_begin_attempt', {
    p_rate_key: input.key,
    p_window_ms: windowMs,
    p_max: maxFailures,
  });
  if (rpc.error) {
    if (isMissingRelationOrRpc(rpc.error)) {
      warnFailOpen(
        'intern_signup_rate_limits / intern_signup_rate_limit_begin_attempt missing',
      );
      return { ok: true, failOpen: true };
    }
    return { ok: false, unavailable: true };
  }
  const parsed = parseBeginResult(rpc.data);
  if (!parsed.allowed) {
    return { ok: false, fail_count: parsed.fail_count };
  }
  return { ok: true, fail_count: parsed.fail_count };
}

/**
 * Drop a reserved slot after a successful code (successes are not counted).
 * Missing function fails OPEN. Any other rpc.error fails CLOSED.
 */
export async function refundInternSignupAttempt(input) {
  const rpc = await input.admin.rpc('intern_signup_rate_limit_refund_success', {
    p_rate_key: input.key,
  });
  if (rpc.error) {
    if (isMissingRelationOrRpc(rpc.error)) {
      warnFailOpen('intern_signup_rate_limit_refund_success missing');
      return { skipped: true };
    }
    return { unavailable: true };
  }
  return { fail_count: Number(rpc.data) || 0 };
}

/**
 * @deprecated use beginInternSignupAttempt — kept for PGlite grant checks.
 */
export async function recordInternSignupFail(input) {
  const windowMs = input.windowMs ?? INTERN_SIGNUP_RATE_WINDOW_MS;
  const rpc = await input.admin.rpc('intern_signup_rate_limit_record_fail', {
    p_rate_key: input.key,
    p_window_ms: windowMs,
  });
  if (!rpc.error) return;
  if (isMissingRelationOrRpc(rpc.error)) {
    warnFailOpen('intern_signup_rate_limit_record_fail missing');
    return;
  }
  throw new Error(INTERN_SIGNUP_UNAVAILABLE_MESSAGE);
}
