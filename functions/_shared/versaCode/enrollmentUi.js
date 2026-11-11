import { GENERIC_DENY_MESSAGE, REASONS } from './constants.js';

/** Standalone activation-harness states. */
export const ENROLLMENT_UI_STATES = Object.freeze([
  'success',
  'invalid',
  'expired',
  'already-redeemed',
  'identity-mismatch',
  'wrong-course-level',
  'free-no-code',
]);

export const ENROLLMENT_STATE_COPY = Object.freeze({
  success: 'Access verified. You can continue to SPIKE Learning.',
  invalid: GENERIC_DENY_MESSAGE,
  expired: 'This access code has expired.',
  'already-redeemed': 'This access code has already been used.',
  'identity-mismatch': 'This access code is not linked to your account.',
  'wrong-course-level': 'This access code is for a different course or level.',
  'free-no-code': 'This offering is free — no access code is required.',
});

/**
 * Map portable verifier reasons to activation UI states.
 * @param {{ ok?: boolean, reason?: string }} result
 */
export function enrollmentUiState(result = {}) {
  const reason = String(result.reason || '');
  if (reason === REASONS.code_not_required) return 'free-no-code';
  if (result.ok === true || reason === REASONS.valid || reason === REASONS.already_granted) {
    return 'success';
  }
  if (reason === REASONS.expired) return 'expired';
  if (reason === REASONS.reused) return 'already-redeemed';
  if (reason === REASONS.wrong_identity) return 'identity-mismatch';
  if (reason === REASONS.wrong_program_route || reason === REASONS.wrong_offering) {
    return 'wrong-course-level';
  }
  return 'invalid';
}

/** @param {string} state */
export function enrollmentUiMessage(state) {
  return ENROLLMENT_STATE_COPY[state] || ENROLLMENT_STATE_COPY.invalid;
}

/**
 * Entitlement for course X never unlocks course Y.
 * Match `program_route` only — offering ids are shared across programs.
 */
export function hasProgramEntitlement(entitlements, programRoute) {
  const want = String(programRoute || '');
  if (!want) return false;
  return (Array.isArray(entitlements) ? entitlements : []).some(
    (row) => String(row?.program_route || '') === want,
  );
}

/** intern_progress.program_slug → portable intendedCourse */
export function programSlugToVersaRoute(slug) {
  return String(slug || '') === 'ra-spike' ? 'ra-spike' : 'spike-interns';
}
