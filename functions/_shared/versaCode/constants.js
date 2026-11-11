/** Disabled-by-default SPIKE–Versa CSV code gate (SPIKE #7 Checkpoint 01). */

export const VERSA_FLAG_ENV = 'VERSA_CSV_CODE_GATE';
export const VERSA_HMAC_SECRET_ENV = 'VERSA_CODE_HMAC_SECRET';
export const VERSA_L1_OFFERING_ENV = 'VERSA_L1_OFFERING_ID';

export const GENERIC_DENY_MESSAGE =
  "We couldn't verify this code for your account. Check the code or use the enrollment help link.";

/** Neutral placeholder — Versa delivery channel is an open external dependency. */
export const VERSA_HELP_PLACEHOLDER =
  'Access codes are issued through the SPIKE–Versa enrollment process. Delivery channel is pending the co-branded enrollment page.';

export const LEVELS = Object.freeze(['L1', 'L2']);
export const STATUSES = Object.freeze(['available', 'redeemed', 'revoked', 'expired']);
export const PROGRAM_ROUTES = Object.freeze(['spike-interns', 'ra-spike']);

export const DEFAULT_L1_OFFERING_ID = 'financial-literacy';
export const DEFAULT_L2_OFFERING_ID = 'financial-entrepreneurship';

export const REASONS = Object.freeze({
  valid: 'valid',
  unknown: 'unknown',
  wrong_identity: 'wrong_identity',
  wrong_offering: 'wrong_offering',
  reused: 'reused',
  revoked: 'revoked',
  expired: 'expired',
  rate_limited: 'rate_limited',
  gate_unsatisfied: 'gate_unsatisfied',
  already_granted: 'already_granted',
  flag_off: 'flag_off',
  missing_secret: 'missing_secret',
  missing_identity_link: 'missing_identity_link',
  invalid_row: 'invalid_row',
  wrong_program_route: 'wrong_program_route',
  unverified_identity: 'unverified_identity',
});

/**
 * Assumed Versa CSV headers. Column names are NOT agreed with Versa yet —
 * importers must pass a columnMap when the file differs.
 */
export const ASSUMED_CSV_COLUMNS = Object.freeze({
  code: 'code',
  versaLeadRef: 'versa_lead_ref',
  verifiedEmail: 'verified_email',
  verifiedUserId: 'verified_user_id',
  level: 'level',
  offeringId: 'offering_id',
  status: 'status',
  batchId: 'batch_id',
  externalCodeId: 'external_code_id',
  issuedAt: 'issued_at',
  expiresAt: 'expires_at',
  paymentConfirmationRef: 'payment_confirmation_ref',
  programRoute: 'program_route',
});

export const HEADER_ALIASES = Object.freeze({
  code: ['code', 'access_code', 'accesscode', 'versa_code', 'versacode'],
  versaLeadRef: ['versa_lead_ref', 'lead_ref', 'versaleadref', 'leadref'],
  verifiedEmail: ['verified_email', 'verifiedemail', 'learner_email'],
  verifiedUserId: ['verified_user_id', 'verifieduserid', 'spike_user_id'],
  level: ['level', 'offering_level'],
  offeringId: ['offering_id', 'offering', 'offeringid'],
  status: ['status', 'usage_status', 'state'],
  batchId: ['batch_id', 'batchid'],
  externalCodeId: ['external_code_id', 'externalcodeid', 'code_id'],
  issuedAt: ['issued_at', 'issuedat'],
  expiresAt: ['expires_at', 'expiresat'],
  paymentConfirmationRef: ['payment_confirmation_ref', 'payment_ref'],
  programRoute: ['program_route', 'program', 'pathway'],
});

export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_FAILURES = 8;
