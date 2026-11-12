import { GENERIC_DENY_MESSAGE, REASONS } from './constants.js';
import { createVersaLogger } from './log.js';

/** Single HTTP deny for every verifier reason — no existence oracle. */
export const VERSA_HTTP_DENY_STATUS = 403;
export const VERSA_HTTP_UNAVAILABLE_STATUS = 503;

export function versaHttpDenyBody() {
  return { message: GENERIC_DENY_MESSAGE };
}

/**
 * Log the detailed reason server-side (redacted logger), return the generic
 * HTTP payload. Extra fields (e.g. demo: true) must not vary by reason.
 * @param {{ reason?: string }} [result]
 * @param {Record<string, unknown>} [extras]
 */
export function versaHttpDeny(result = {}, extras = {}) {
  createVersaLogger().warn({
    event: 'versa_http_denied',
    reason: result.reason || 'denied',
  });
  return {
    status: result.reason === REASONS.unavailable ? VERSA_HTTP_UNAVAILABLE_STATUS : VERSA_HTTP_DENY_STATUS,
    body: { ...versaHttpDenyBody(), ...extras },
  };
}
