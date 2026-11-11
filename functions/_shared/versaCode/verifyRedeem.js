import {
  DEFAULT_L1_OFFERING_ID,
  GENERIC_DENY_MESSAGE,
  REASONS,
  VERSA_L1_OFFERING_ENV,
} from './constants.js';
import { digestCode, normalizeEmail, normalizeSubmittedCode, requireHmacSecret } from './digest.js';
import { isVersaCsvCodeGateEnabled } from './flag.js';
import { consumeAndGrant, findInventoryByDigest, recordAttempt } from './inventory.js';
import { createVersaLogger } from './log.js';
import { evaluateExistingOfferingGate } from './offeringGate.js';
import { assertDurableRateLimit, rateLimitKey, recordDurableFail } from './rateLimit.js';

function expectedL1Offering(env) {
  return String(env?.[VERSA_L1_OFFERING_ENV] ?? '').trim() || DEFAULT_L1_OFFERING_ID;
}

/**
 * Authenticated session identity vs imported verified link.
 * A typed/unverified email is never proof. Accept:
 * - CSV verified_user_id === session user id
 * - auth-provider-confirmed email matching CSV verified_email
 * - server-side Versa handoff flag plus matching verified link
 *
 * @param {object} row
 * @param {{
 *   userId?: string | null,
 *   email?: string | null,
 *   emailConfirmed?: boolean,
 *   versaHandoffVerified?: boolean,
 * }} identity
 */
export function identityMatchesImportedRow(row, identity) {
  const sessionUserId = identity?.userId ? String(identity.userId) : '';
  if (!sessionUserId) return false;

  const verifiedEmail = normalizeEmail(row?.verified_email);
  const verifiedUserId = row?.verified_user_id ? String(row.verified_user_id) : '';
  const sessionEmail = normalizeEmail(identity?.email);

  if (!verifiedEmail && !verifiedUserId) return false;
  if (verifiedUserId && verifiedUserId === sessionUserId) return true;

  const sessionEmailIsProven =
    identity?.emailConfirmed === true || identity?.versaHandoffVerified === true;
  if (sessionEmailIsProven && verifiedEmail && sessionEmail && verifiedEmail === sessionEmail) {
    return true;
  }
  return false;
}

function offeringMatches(row, expected) {
  if (!expected?.level) return true;
  if (String(row.level).toUpperCase() !== String(expected.level).toUpperCase()) return false;
  if (expected.offeringId && String(row.offering_id) !== String(expected.offeringId)) return false;
  return true;
}

function programRouteMatches(row, expected) {
  if (!expected?.programRoute) return true;
  return String(row.program_route) === String(expected.programRoute);
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
 *   identity: {
 *     userId?: string | null,
 *     email?: string | null,
 *     emailConfirmed?: boolean,
 *     versaHandoffVerified?: boolean,
 *   },
 *   expected?: { level?: string, offeringId?: string | null, programRoute?: string },
 *   paymentVerified?: boolean,
 *   prerequisiteOk?: boolean,
 *   consume?: boolean,
 *   grantIntern?: boolean,
 *   logger?: ReturnType<typeof createVersaLogger>,
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
  const limited = await assertDurableRateLimit({ admin: input.admin, key: rlKey });
  if (!limited.ok) {
    logger.warn({ event: 'versa_denied', reason: REASONS.rate_limited });
    return { ok: false, reason: REASONS.rate_limited, message: GENERIC_DENY_MESSAGE };
  }

  if (!input.identity?.userId) {
    await recordDurableFail({ admin: input.admin, key: rlKey });
    logger.warn({ event: 'versa_denied', reason: REASONS.unverified_identity });
    return { ok: false, reason: REASONS.unverified_identity, message: GENERIC_DENY_MESSAGE };
  }

  if (!submittedCode) {
    await recordDurableFail({ admin: input.admin, key: rlKey });
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
    await recordDurableFail({ admin: input.admin, key: rlKey });
    await recordAttempt(input.admin, { actorUserId: input.identity?.userId, reason: REASONS.unknown });
    logger.warn({ event: 'versa_denied', reason: REASONS.unknown });
    return { ok: false, reason: REASONS.unknown, message: GENERIC_DENY_MESSAGE };
  }

  const deny = async (reason) => {
    await recordDurableFail({ admin: input.admin, key: rlKey });
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

  const expected = input.expected || {
    level: 'L1',
    offeringId: expectedL1Offering(env),
    programRoute: 'spike-interns',
  };
  if (!programRouteMatches(row, expected)) {
    return deny(REASONS.wrong_program_route);
  }
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

  const grantIntern =
    input.grantIntern === true
    && String(row.program_route) === 'spike-interns'
    && String(row.level).toUpperCase() === 'L1';

  const granted = await consumeAndGrant(input.admin, {
    id: row.id,
    userId: input.identity.userId,
    grantIntern,
  });
  if (!granted?.ok) {
    return deny(granted?.reason || REASONS.reused);
  }

  logger.info({
    event: granted.already_granted ? 'versa_already_granted' : 'versa_redeemed',
    inventoryId: granted.row?.id || row.id,
    level: granted.row?.level || row.level,
    offeringId: granted.row?.offering_id || row.offering_id,
    programRoute: granted.row?.program_route || row.program_route,
  });

  return {
    ok: true,
    reason: granted.already_granted ? REASONS.already_granted : REASONS.valid,
    alreadyGranted: Boolean(granted.already_granted),
    row: granted.row || row,
    entitlement: granted.entitlement,
    message: 'Access verified',
  };
}

export { GENERIC_DENY_MESSAGE };
