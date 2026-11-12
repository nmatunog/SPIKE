/** Durable intern-signup attempt limit, modeled on versa_rate_limits. */

import { getActivationDateKey } from './activationCode.js';

export const INTERN_SIGNUP_RATE_WINDOW_MS = 10 * 60 * 1000;
/** Classroom-safe shared-IP cap (one NAT / wifi). Config via INTERN_SIGNUP_RATE_MAX. */
export const INTERN_SIGNUP_RATE_MAX_DEFAULT = 20;
export const INTERN_SIGNUP_RATE_MAX_ENV = 'INTERN_SIGNUP_RATE_MAX';
export const INTERN_SIGNUP_RATE_LIMITED_MESSAGE = 'Too many attempts. Try again later.';

/**
 * Global failed-attempt ceiling per Manila code-day (`global:YYYY-MM-DD`).
 * Independent of per-IP 20/10min. Config via INTERN_SIGNUP_GLOBAL_MAX.
 */
export const INTERN_SIGNUP_GLOBAL_MAX_DEFAULT = 200;
export const INTERN_SIGNUP_GLOBAL_MAX_ENV = 'INTERN_SIGNUP_GLOBAL_MAX';
/** Long enough that a same-day `global:<date>` row is not reset by the 10-minute IP window. */
export const INTERN_SIGNUP_GLOBAL_WINDOW_MS = 48 * 60 * 60 * 1000;
export const INTERN_SIGNUP_GLOBAL_CEILING_ALERT = 'INTERN SIGNUP GLOBAL CEILING';

const FAILED_CODE_RE =
  /invalid activation code|activation code has expired|no activation code is available/i;

export function internSignupRateMax(env = {}) {
  const raw = env?.[INTERN_SIGNUP_RATE_MAX_ENV];
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return INTERN_SIGNUP_RATE_MAX_DEFAULT;
}

export function internSignupGlobalMax(env = {}) {
  const raw = env?.[INTERN_SIGNUP_GLOBAL_MAX_ENV];
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return INTERN_SIGNUP_GLOBAL_MAX_DEFAULT;
}

export function internSignupGlobalRateKey(dateKey = getActivationDateKey()) {
  return `global:${dateKey}`;
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

function expandIpv6Hextets(ip) {
  let bare = String(ip || '').trim();
  if (bare.startsWith('[') && bare.endsWith(']')) bare = bare.slice(1, -1);
  const zone = bare.indexOf('%');
  if (zone >= 0) bare = bare.slice(0, zone);
  if (!bare.includes(':')) return null;
  const halves = bare.split('::');
  if (halves.length > 2) return null;
  const parse = (side) => (side ? side.split(':').filter((p) => p !== '') : []);
  if (halves.length === 2) {
    const head = parse(halves[0]);
    const tail = parse(halves[1]);
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    return [...head, ...Array.from({ length: missing }, () => '0'), ...tail];
  }
  const parts = parse(bare);
  return parts.length === 8 ? parts : null;
}

/** IPv4 unchanged; IPv6 aggregated to the /64 prefix (`a:b:c:d::/64`). */
export function normalizeClientIp(raw) {
  let ip = String(raw || '').trim() || 'unknown';
  if (ip === 'unknown') return ip;
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
  const zone = ip.indexOf('%');
  if (zone >= 0) ip = ip.slice(0, zone);
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return ip;
  const hextets = expandIpv6Hextets(ip);
  if (!hextets || hextets.length !== 8) return ip;
  const prefix = hextets.slice(0, 4).map((h) => {
    const lower = String(h).toLowerCase().replace(/^0+(?=\w)/, '');
    return lower || '0';
  });
  return `${prefix.join(':')}::/64`;
}

/**
 * Cloudflare edge IP only. Missing/blank CF-Connecting-IP → `ip:unknown`
 * (one shared bucket). X-Forwarded-For is ignored.
 * @param {Request | null | undefined} request
 */
export function internSignupRateKey(request) {
  const header = request?.headers?.get('CF-Connecting-IP');
  const ip = typeof header === 'string' && header.trim() ? header.trim() : 'unknown';
  return `ip:${normalizeClientIp(ip)}`;
}

/** RPC begin_attempt must return the boolean `allowed: true`. Missing/false denies. */
export function parseBeginResult(data) {
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
    allowed: row?.allowed === true,
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
 * Drop intern_signup_rate_limit_record_fail in a later pass (not this one).
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
