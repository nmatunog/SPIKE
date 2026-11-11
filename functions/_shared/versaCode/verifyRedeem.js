import {
  DEFAULT_L1_OFFERING_ID,
  GENERIC_DENY_MESSAGE,
  REASONS,
  VERSA_L1_OFFERING_ENV,
} from './constants.js';
import { digestCode, normalizeEmail, normalizeSubmittedCode, requireHmacSecret } from './digest.js';
import { isVersaCsvCodeGateEnabled } from './flag.js';
import { consumeInventoryRow, findInventoryByDigest, recordAttempt, upsertEntitlement } from './inventory.js';
import { createVersaLogger } from './log.js';
import { evaluateExistingOfferingGate } from './offeringGate.js';
import { assertNotRateLimited, rateLimitKey, recordFailedAttempt } from './rateLimit.js';

function expectedL1Offering(env) {
  return String(env?.[VERSA_L1_OFFERING_ENV] ?? '').trim() || DEFAULT_L1_OFFERING_ID;
}

/**
 * Handed-off identity is the authenticated session (or post-create user id)
 * matched to the CSV verified link. Typed versa_lead_ref is never proof.
 *
 * @param {object} row
 * @param {{ userId?: string | null, email?: string | null }} identity
 */
export function identityMatchesImportedRow(row, identity) {
  const verifiedEmail = normalizeEmail(row?.verified_email);
  const verifiedUserId = row?.verified_user_id ? String(row.verified_user_id) : '';
  const sessionEmail = normalizeEmail(identity?.email);
  const sessionUserId = identity?.userId ? String(identity.userId) : '';

  if (!verifiedEmail && !verifiedUserId) return false;
  if (verifiedUserId && sessionUserId && verifiedUserId === sessionUserId) return true;
  if (verifiedEmail && sessionEmail && verifiedEmail === sessionEmail) return true;
  return false;
}

function offeringMatches(row, expected) {
  if (!expected?.level) return true;
  if (String(row.level).toUpperCase() !== String(expected.level).toUpperCase()) return false;
  if (expected.offeringId && String(row.offering_id) !== String(expected.offeringId)) return false;
  return true;
}

function rowUnavailableReason(row, now = Date.now()) {
  const status = String(row?.status ?? '').toLowerCase();
  if (status === 'revoked' || status === 'invalid') return REASONS.revoked;
  if (status === 'expired') return REASONS.expired;
  if (row?.expires_at && new Date(row.expires_at).getTime() < now) return REASONS.expired;
  if (status === 'redeemed') return REASONS.reused;
  if (status !== 'available') return REASONS.revoked;
  return null;
}

/**
 * @param {{
 *   env: Record<string, string>,
 *   admin: import('@supabase/supabase-js').SupabaseClient,
 *   request?: Request | null,
 *   submittedCode: string,
 *   identity: { userId?: string | null, email?: string | null },
 *   expected?: { level?: string, offeringId?: string | null },
 *   paymentVerified?: boolean,
 *   prerequisiteOk?: boolean,
 *   consume?: boolean,
 *   logger?: ReturnType<typeof createVersaLogger>,
 *   rateLimitStore?: Map<string, { count: number, resetAt: number }>,
 * }} input
 */
export async function verifyVersaCode(input) {
  const logger = input.logger || createVersaLogger();
  const env = input.env || {};
  const consume = input.consume !== false;
  const submittedCode = normalizeSubmittedCode(input.submittedCode);

  if (!isVersaCsvCodeGateEnabled(env)) {
    return { ok: false, reason: REASONS.flag_off, message: GENERIC_DENY_MESSAGE };
  }

  const rlKey = rateLimitKey(input.request, input.identity);
  const limited = assertNotRateLimited({ store: input.rateLimitStore, key: rlKey });
  if (!limited.ok) {
    logger.warn({ event: 'versa_denied', reason: REASONS.rate_limited });
    return { ok: false, reason: REASONS.rate_limited, message: GENERIC_DENY_MESSAGE };
  }

  if (!submittedCode) {
    recordFailedAttempt({ store: input.rateLimitStore, key: rlKey });
    logger.warn({ event: 'versa_denied', reason: REASONS.unknown });
    return { ok: false, reason: REASONS.unknown, message: GENERIC_DENY_MESSAGE };
  }

  let secret;
  try {
    secret = requireHmacSecret(env);
  } catch {
    logger.error({ event: 'versa_misconfigured', reason: REASONS.missing_secret });
    return { ok: false, reason: REASONS.missing_secret, message: GENERIC_DENY_MESSAGE };
  }

  const digest = await digestCode(secret, submittedCode);
  const row = await findInventoryByDigest(input.admin, digest);
  if (!row) {
    recordFailedAttempt({ store: input.rateLimitStore, key: rlKey });
    await recordAttempt(input.admin, { actorUserId: input.identity?.userId, reason: REASONS.unknown });
    logger.warn({ event: 'versa_denied', reason: REASONS.unknown });
    return { ok: false, reason: REASONS.unknown, message: GENERIC_DENY_MESSAGE };
  }

  const deny = async (reason) => {
    recordFailedAttempt({ store: input.rateLimitStore, key: rlKey });
    await recordAttempt(input.admin, {
      actorUserId: input.identity?.userId,
      inventoryId: row.id,
      reason,
      offeringId: row.offering_id,
      level: row.level,
      programRoute: row.program_route,
    });
    logger.warn({ event: 'versa_denied', reason, inventoryId: row.id });
    return { ok: false, reason, message: GENERIC_DENY_MESSAGE, inventoryId: row.id };
  };

  if (!identityMatchesImportedRow(row, input.identity)) {
    return deny(REASONS.wrong_identity);
  }

  const expected = input.expected || { level: 'L1', offeringId: expectedL1Offering(env) };
  if (!offeringMatches(row, expected)) {
    return deny(REASONS.wrong_offering);
  }

  const unavailable = rowUnavailableReason(row);
  if (unavailable === REASONS.reused) {
    if (input.identity?.userId && String(row.redeemed_by) === String(input.identity.userId)) {
      logger.info({ event: 'versa_already_granted', inventoryId: row.id });
      return {
        ok: true,
        reason: REASONS.already_granted,
        alreadyGranted: true,
        row,
        message: 'Access verified',
      };
    }
    return deny(REASONS.reused);
  }
  if (unavailable) return deny(unavailable);

  const gate = evaluateExistingOfferingGate({
    level: row.level,
    offeringId: row.offering_id,
    paymentVerified: input.paymentVerified === true,
    prerequisiteOk: input.prerequisiteOk,
  });
  if (!gate.ok) return deny(gate.reason);

  if (!consume) {
    return { ok: true, reason: REASONS.valid, row, message: 'Access verified' };
  }

  if (!input.identity?.userId) {
    return deny(REASONS.wrong_identity);
  }

  const consumed = await consumeInventoryRow(input.admin, {
    id: row.id,
    userId: input.identity.userId,
  });
  if (!consumed) {
    return deny(REASONS.reused);
  }

  const entitlement = await upsertEntitlement(input.admin, {
    userId: input.identity.userId,
    inventoryId: consumed.id,
    versaLeadRef: consumed.versa_lead_ref,
    level: consumed.level,
    offeringId: consumed.offering_id,
    programRoute: consumed.program_route,
  });

  logger.info({
    event: 'versa_redeemed',
    inventoryId: consumed.id,
    level: consumed.level,
    offeringId: consumed.offering_id,
    programRoute: consumed.program_route,
  });

  return {
    ok: true,
    reason: REASONS.valid,
    row: consumed,
    entitlement,
    message: 'Access verified',
  };
}

export { GENERIC_DENY_MESSAGE };
