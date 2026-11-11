import { RATE_LIMIT_MAX_FAILURES, RATE_LIMIT_WINDOW_MS, REASONS } from './constants.js';

/** @type {Map<string, { count: number, resetAt: number }>} */
const defaultStore = new Map();

/**
 * Best-effort per-isolate limiter. Durable KV is a later owner decision.
 * @param {{
 *   store?: Map<string, { count: number, resetAt: number }>,
 *   key: string,
 *   now?: number,
 *   windowMs?: number,
 *   maxFailures?: number,
 * }} input
 */
export function assertNotRateLimited(input) {
  const store = input.store || defaultStore;
  const now = input.now ?? Date.now();
  const maxFailures = input.maxFailures ?? RATE_LIMIT_MAX_FAILURES;
  const current = store.get(input.key);
  if (current && current.resetAt > now && current.count >= maxFailures) {
    return { ok: false, reason: REASONS.rate_limited };
  }
  if (current && current.resetAt <= now) {
    store.delete(input.key);
  }
  return { ok: true };
}

/**
 * @param {{
 *   store?: Map<string, { count: number, resetAt: number }>,
 *   key: string,
 *   now?: number,
 *   windowMs?: number,
 * }} input
 */
export function recordFailedAttempt(input) {
  const store = input.store || defaultStore;
  const now = input.now ?? Date.now();
  const windowMs = input.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const current = store.get(input.key);
  if (!current || current.resetAt <= now) {
    store.set(input.key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
}

/** @param {Map<string, { count: number, resetAt: number }> | undefined} store */
export function resetVersaRateLimitStore(store = defaultStore) {
  store.clear();
}

/**
 * @param {Request | null | undefined} request
 * @param {{ userId?: string | null, email?: string | null }} identity
 */
export function rateLimitKey(request, identity) {
  if (identity?.userId) return `user:${identity.userId}`;
  const ip =
    request?.headers?.get('CF-Connecting-IP') ||
    request?.headers?.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';
  return `ip:${ip}`;
}

export { defaultStore as versaRateLimitStore };
