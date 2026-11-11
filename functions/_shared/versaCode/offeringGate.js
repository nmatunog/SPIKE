import { REASONS } from './constants.js';

/**
 * Existing L1-free / L2-paid gate — the CSV match is never payment proof.
 * L1: free, no payment check.
 * L2: requires a verified payment/prerequisite signal from the existing
 * paid gate (not yet located on main). Until Nilo confirms that hook,
 * paymentVerified must be passed true by a future caller; default deny.
 *
 * @param {{
 *   level: string,
 *   offeringId?: string | null,
 *   paymentVerified?: boolean,
 *   prerequisiteOk?: boolean,
 * }} input
 */
export function evaluateExistingOfferingGate(input) {
  const level = String(input?.level ?? '').toUpperCase();
  if (level === 'L1') {
    return { ok: true };
  }
  if (level === 'L2') {
    if (input?.paymentVerified === true && input?.prerequisiteOk !== false) {
      return { ok: true };
    }
    return { ok: false, reason: REASONS.gate_unsatisfied };
  }
  return { ok: false, reason: REASONS.wrong_offering };
}
