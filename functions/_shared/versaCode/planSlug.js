import {
  DEFAULT_L1_OFFERING_ID,
  DEFAULT_L2_OFFERING_ID,
  REASONS,
  VERSA_PRO_CODE_IMPLIES_PAID_ENV,
} from './constants.js';

/**
 * Locked Versa PlanSlug → SPIKE pathway. Unknown slugs are rejected at import.
 * `free` is Gate 1 Literacy + Gate 2 FEP Preview on the intern pathway only.
 * `pro` is Gate 3 / paid L2. Never auto-grant both intern and RA-SPIKE.
 *
 * @typedef {{
 *   slug: string,
 *   plan: string,
 *   programRoute: 'spike-interns',
 *   level: 'L1' | 'L2',
 *   paymentRequired: boolean,
 *   offerings: { id: string, label: string }[],
 * }} PlanSlugMapping
 */

/** @type {Readonly<Record<string, PlanSlugMapping>>} */
export const PLAN_SLUG_MAP = Object.freeze({
  free: Object.freeze({
    slug: 'free',
    plan: 'CRM Free',
    programRoute: 'spike-interns',
    level: 'L1',
    paymentRequired: false,
    offerings: Object.freeze([
      Object.freeze({ id: DEFAULT_L1_OFFERING_ID, label: 'Gate 1 Literacy' }),
      Object.freeze({ id: 'fep', label: 'Gate 2 FEP Preview' }),
    ]),
  }),
  pro: Object.freeze({
    slug: 'pro',
    plan: 'CRM Pro',
    programRoute: 'spike-interns',
    level: 'L2',
    paymentRequired: true,
    offerings: Object.freeze([
      Object.freeze({ id: DEFAULT_L2_OFFERING_ID, label: 'Gate 3 / L2' }),
    ]),
  }),
});

/** @param {unknown} value */
export function normalizePlanSlug(value) {
  return String(value ?? '').trim().toLowerCase();
}

/** @param {unknown} slug */
export function resolvePlanSlug(slug) {
  return PLAN_SLUG_MAP[normalizePlanSlug(slug)] || null;
}

/**
 * Nilo's decision: a `pro` code is not payment proof unless this switch is on.
 * Default false. HTTP bodies must never set it.
 * @param {Record<string, string | undefined> | null | undefined} env
 */
export function isVersaProCodeImpliesPaid(env) {
  const raw = String(env?.[VERSA_PRO_CODE_IMPLIES_PAID_ENV] ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
}

/**
 * Course/level checks run through the slug map, not CSV program_route.
 * @param {PlanSlugMapping | null} mapping
 * @param {{ level?: string, offeringId?: string | null, programRoute?: string }} [expected]
 */
export function matchIntendedToPlanSlug(mapping, expected = {}) {
  if (!mapping) return { ok: false, reason: REASONS.invalid_row };
  const programRoute = expected.programRoute ? String(expected.programRoute) : '';
  if (programRoute && programRoute !== mapping.programRoute) {
    return { ok: false, reason: REASONS.wrong_program_route };
  }
  const level = expected.level ? String(expected.level).toUpperCase() : '';
  if (level && level !== mapping.level) {
    return { ok: false, reason: REASONS.wrong_offering };
  }
  const offeringId = expected.offeringId ? String(expected.offeringId) : '';
  if (offeringId && !mapping.offerings.some((row) => row.id === offeringId)) {
    return { ok: false, reason: REASONS.wrong_offering };
  }
  return { ok: true };
}

/** @param {{ plan_slug?: string, offering_id?: string, level?: string, program_route?: string }} row */
export function offeringsFromInventoryRow(row) {
  const mapping = resolvePlanSlug(row?.plan_slug);
  if (mapping?.offerings?.length) {
    return mapping.offerings.map((offering) => ({
      offeringId: offering.id,
      label: offering.label,
      level: mapping.level,
      programRoute: mapping.programRoute,
      paymentRequired: mapping.paymentRequired,
    }));
  }
  if (!row?.offering_id) return [];
  return [{
    offeringId: row.offering_id,
    label: row.offering_id,
    level: row.level,
    programRoute: row.program_route,
    paymentRequired: false,
  }];
}
