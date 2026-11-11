import { normalizeEmail } from './digest.js';
import { listEntitlementsForUser, upsertEntitlement } from './inventory.js';

/**
 * IdentityProvider
 *
 * A verified identity MUST come from:
 * - the chosen auth provider (session user id, and email only when that
 *   provider has confirmed it — e.g. email_confirmed_at), or
 * - a Versa-verified handoff payload (versa_lead_ref + verified flag).
 *
 * A typed / unverified email is never proof. This module does not flip
 * emailConfirm:true on portal signup.
 *
 * @typedef {{
 *   userId: string | null,
 *   email: string | null,
 *   emailConfirmed: boolean,
 *   versaHandoffVerified: boolean,
 *   versaLeadRef: string | null,
 *   source: 'auth_provider' | 'versa_handoff' | 'unverified',
 * }} VerifiedIdentity
 *
 * @typedef {{ resolve: () => Promise<VerifiedIdentity> }} IdentityProvider
 */

/**
 * Auth-provider session. Email is proven only when the provider confirmed it.
 * @param {{
 *   userId?: string | null,
 *   email?: string | null,
 *   emailConfirmed?: boolean,
 *   emailConfirmedAt?: string | null,
 * }} session
 * @returns {IdentityProvider}
 */
export function createSessionIdentityProvider(session = {}) {
  return {
    async resolve() {
      const userId = session.userId ? String(session.userId) : null;
      const emailConfirmed = session.emailConfirmed === true || Boolean(session.emailConfirmedAt);
      return {
        userId,
        email: normalizeEmail(session.email) || null,
        emailConfirmed,
        versaHandoffVerified: false,
        versaLeadRef: null,
        source: userId ? 'auth_provider' : 'unverified',
      };
    },
  };
}

/**
 * Mock Versa handoff payload. Plug the real landing-page payload in later.
 * @param {{
 *   versaLeadRef: string,
 *   verified?: boolean,
 *   userId?: string | null,
 *   verifiedUserId?: string | null,
 *   verifiedEmail?: string | null,
 * }} payload
 * @returns {IdentityProvider}
 */
export function createMockVersaHandoffIdentityProvider(payload = {}) {
  return {
    async resolve() {
      const verified = payload.verified === true;
      const userId = payload.userId || payload.verifiedUserId || null;
      return {
        userId: userId ? String(userId) : null,
        email: normalizeEmail(payload.verifiedEmail) || null,
        emailConfirmed: false,
        versaHandoffVerified: verified,
        versaLeadRef: payload.versaLeadRef ? String(payload.versaLeadRef) : null,
        source: verified ? 'versa_handoff' : 'unverified',
      };
    },
  };
}

/**
 * EntitlementGrantor
 *
 * Grant runs inside the redeem transaction only after identity match.
 * Returning learners with an existing portable entitlement bypass redemption.
 * Destination hosts (intern portal, RA-SPIKE) plug in later — mocks never set
 * profiles.role = INTERN.
 *
 * @typedef {{
 *   hasExisting: (userId: string, offeringId: string, programRoute?: string) => Promise<boolean>,
 *   grant: (input: { userId: string, row: object, paymentVerified?: boolean }) => Promise<object>,
 * }} EntitlementGrantor
 */

/** Portable store: versa_entitlements only. */
export function createPortableEntitlementGrantor(admin) {
  return {
    async hasExisting(userId, offeringId, programRoute) {
      const rows = await listEntitlementsForUser(admin, userId);
      return rows.some(
        (row) =>
          String(row.offering_id) === String(offeringId) &&
          (!programRoute || String(row.program_route) === String(programRoute)),
      );
    },
    async grant({ userId, row }) {
      return upsertEntitlement(admin, {
        userId,
        inventoryId: row.id,
        versaLeadRef: row.versa_lead_ref,
        level: row.level,
        offeringId: row.offering_id,
        programRoute: row.program_route,
      });
    },
  };
}

/** In-memory L1 grantor for synthetic tests. Never assigns intern role. */
export function createMockL1Grantor() {
  /** @type {object[]} */
  const grants = [];
  return {
    grants,
    level: 'L1',
    async hasExisting(userId, offeringId, programRoute) {
      return grants.some(
        (row) =>
          String(row.userId) === String(userId) &&
          String(row.offeringId) === String(offeringId) &&
          (!programRoute || String(row.programRoute) === String(programRoute)),
      );
    },
    async grant({ userId, row }) {
      if (String(row.level).toUpperCase() !== 'L1') {
        throw new Error('L1 grantor cannot grant a non-L1 row.');
      }
      const record = {
        userId,
        offeringId: row.offering_id,
        level: 'L1',
        programRoute: row.program_route,
        versaLeadRef: row.versa_lead_ref,
        role: null,
      };
      grants.push(record);
      return record;
    },
  };
}

/**
 * In-memory future-L2 grantor. Payment proof must come from the authorized
 * provider (`paymentVerified`), never from the CSV row.
 */
export function createMockL2Grantor({ paymentVerified = false } = {}) {
  /** @type {object[]} */
  const grants = [];
  return {
    grants,
    level: 'L2',
    paymentVerified: Boolean(paymentVerified),
    async hasExisting(userId, offeringId, programRoute) {
      return grants.some(
        (row) =>
          String(row.userId) === String(userId) &&
          String(row.offeringId) === String(offeringId) &&
          (!programRoute || String(row.programRoute) === String(programRoute)),
      );
    },
    async grant({ userId, row, paymentVerified: paid }) {
      if (String(row.level).toUpperCase() !== 'L2') {
        throw new Error('L2 grantor cannot grant a non-L2 row.');
      }
      if (paid !== true && this.paymentVerified !== true) {
        throw new Error('L2 grant requires paymentVerified from the authorized provider.');
      }
      const record = {
        userId,
        offeringId: row.offering_id,
        level: 'L2',
        programRoute: row.program_route,
        versaLeadRef: row.versa_lead_ref,
        role: null,
      };
      grants.push(record);
      return record;
    },
  };
}
