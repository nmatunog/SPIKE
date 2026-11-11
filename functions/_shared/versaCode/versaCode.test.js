import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { handleVersaImport } from '../../api/versa/import.js';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import {
  createMockL1Grantor,
  createMockL2Grantor,
  createMockVersaHandoffIdentityProvider,
  createSessionIdentityProvider,
} from './adapters.js';
import { ASSUMED_CSV_COLUMNS, GENERIC_DENY_MESSAGE, HEADER_ALIASES, REASONS } from './constants.js';
import { parseVersaCsv } from './csv.js';
import { digestCode, requireHmacSecret } from './digest.js';
import { importVersaCsv } from './importRows.js';
import { consumeInventoryRow } from './inventory.js';
import { assertDurableRateLimit, resetVersaRateLimitStore } from './rateLimit.js';
import { createMemoryAdmin } from './test/memoryAdmin.js';
import { identityMatchesImportedRow, verifyVersaCode } from './verifyRedeem.js';

const HMAC = 'spike-versa-synthetic-hmac-secret';
const FLAG_ENV = {
  VERSA_CSV_CODE_GATE: '1',
  VERSA_CODE_HMAC_SECRET: HMAC,
};

const CODES = {
  valid: 'SYN-L1-VALID-A1B2',
  wrongIdentity: 'SYN-L1-WRONG-ID-C3',
  wrongLevel: 'SYN-L2-LEVEL-D4',
  unknown: 'SYN-UNKNOWN-XXXX',
  reused: 'SYN-L1-REUSED-E5',
  revoked: 'SYN-L1-REVOKED-F6',
  concurrent: 'SYN-L1-ONCE-G7',
  wrongRoute: 'SYN-L1-ROUTE-H8',
  verifiedUser: 'SYN-L1-UID-I9',
};

const LEARNER = 'learner.valid@example.test';
const OTHER = 'other.person@example.test';
const LEARNER_ID = 'user-l1-1';
const VERIFIED_USER_ID = '00000000-0000-4000-8000-000000000099';

const SYNTHETIC_CSV = `code,versa_lead_ref,verified_email,verified_user_id,level,offering_id,status,program_route
${CODES.valid},lead-valid,${LEARNER},,L1,financial-literacy,available,spike-interns
${CODES.wrongIdentity},lead-other,${OTHER},,L1,financial-literacy,available,spike-interns
${CODES.wrongLevel},lead-l2,${LEARNER},,L2,financial-entrepreneurship,available,spike-interns
${CODES.reused},lead-used,${LEARNER},,L1,financial-literacy,redeemed,spike-interns
${CODES.revoked},lead-rev,${LEARNER},,L1,financial-literacy,revoked,spike-interns
${CODES.concurrent},lead-once,${LEARNER},,L1,financial-literacy,available,spike-interns
${CODES.wrongRoute},lead-route,${LEARNER},,L1,financial-literacy,available,ra-spike
${CODES.verifiedUser},lead-uid,,${VERIFIED_USER_ID},L1,financial-literacy,available,spike-interns
`;

const capturedLogs = [];

function installLogCapture() {
  capturedLogs.length = 0;
  const wrap = (fn) => (...args) => {
    capturedLogs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    return fn?.(...args);
  };
  const original = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    log: console.log,
  };
  console.info = wrap(original.info);
  console.warn = wrap(original.warn);
  console.error = wrap(original.error);
  console.log = wrap(original.log);
  return () => {
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
    console.log = original.log;
  };
}

function postJson(url, body, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  return {
    status: response.status,
    body: await response.json(),
  };
}

function verifiedAuthUser({ id = LEARNER_ID, email = LEARNER } = {}) {
  return {
    id,
    email,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
  };
}

function redeemDeps(admin) {
  return {
    createServiceClient: () => admin,
    createUserClient: () => admin,
  };
}

async function redeem(admin, { code, level, programRoute } = {}) {
  return handleVersaRedeem(
    {
      request: postJson('https://portal.test/api/versa/redeem', { code, level, programRoute }),
      env: FLAG_ENV,
    },
    redeemDeps(admin),
  );
}

describe('Versa CSV portable service', () => {
  let restoreLogs;

  beforeEach(() => {
    resetVersaRateLimitStore();
    restoreLogs = installLogCapture();
  });

  afterEach(() => {
    restoreLogs?.();
  });

  it('documents assumed CSV columns and does not alias plain email', () => {
    expect(ASSUMED_CSV_COLUMNS).toMatchObject({
      code: 'code',
      versaLeadRef: 'versa_lead_ref',
      verifiedEmail: 'verified_email',
    });
    expect(HEADER_ALIASES.verifiedEmail).not.toContain('email');
  });

  it('does not treat a plain email CSV column as verifiedEmail', () => {
    const parsed = parseVersaCsv(`code,versa_lead_ref,email,level
${CODES.valid},lead-typed,${LEARNER},L1
`);
    expect(parsed.ok).toBe(true);
    expect(parsed.records).toHaveLength(0);
    expect(parsed.rejected.some((row) => row.reason === 'missing_verified_identity_link')).toBe(true);
  });

  it('requires a 32+ character HMAC secret', () => {
    expect(() => requireHmacSecret({ VERSA_CODE_HMAC_SECRET: 'x'.repeat(31) })).toThrow(/VERSA_CODE_HMAC_SECRET/);
    expect(requireHmacSecret({ VERSA_CODE_HMAC_SECRET: 'x'.repeat(32) })).toHaveLength(32);
  });

  it('intern-signup is not coupled to the Versa module', async () => {
    const src = await readFile(new URL('../../api/auth/intern-signup.js', import.meta.url), 'utf8');
    expect(src.toLowerCase()).not.toContain('versa');
  });

  it('client daily-code fallback stays fail-closed (F1 trade-off)', async () => {
    const src = await readFile(new URL('../../../src/lib/internSignupService.js', import.meta.url), 'utf8');
    expect(src).toContain('export function clientDailyActivationFallbackAllowed()');
    expect(src).toContain('return false;');
  });

  it('identity match requires a verified session or Versa handoff, not a typed email', () => {
    const row = { verified_email: LEARNER, verified_user_id: null, versa_lead_ref: 'lead-valid' };
    expect(identityMatchesImportedRow(row, { email: LEARNER })).toBe(false);
    expect(identityMatchesImportedRow(row, { userId: LEARNER_ID, email: LEARNER, emailConfirmed: false })).toBe(
      false,
    );
    expect(identityMatchesImportedRow(row, { userId: LEARNER_ID, email: LEARNER, emailConfirmed: true })).toBe(
      true,
    );
    expect(
      identityMatchesImportedRow(row, {
        userId: LEARNER_ID,
        versaHandoffVerified: true,
        versaLeadRef: 'lead-valid',
      }),
    ).toBe(true);
  });

  describe('9+ case matrix on the portable verify path', () => {
    async function setup(authUser = verifiedAuthUser()) {
      const admin = createMemoryAdmin({ authUser });
      const imported = await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
      expect(imported.ok).toBe(true);
      expect(imported.imported).toBe(8);
      return admin;
    }

    it('valid: verified session identity grants a portable entitlement, not intern role', async () => {
      const admin = await setup();
      const grantor = createMockL1Grantor();
      const result = await verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identityProvider: createSessionIdentityProvider({
          userId: LEARNER_ID,
          email: LEARNER,
          emailConfirmed: true,
        }),
        grantor,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
      });
      expect(result.ok).toBe(true);
      expect(result.reason).toBe(REASONS.valid);
      expect(grantor.grants[0]).toMatchObject({
        userId: LEARNER_ID,
        level: 'L1',
        role: null,
      });
      expect(admin.tables.intern_progress).toHaveLength(0);
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'redeemed',
      );
    });

    it('wrong identity', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongIdentity, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_identity)).toBe(true);
    });

    it('wrong level/offering', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongLevel, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_offering)).toBe(true);
    });

    it('unknown', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.unknown }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.unknown)).toBe(true);
    });

    it('reused', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.reused, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.reused)).toBe(true);
    });

    it('revoked', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.revoked, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.revoked)).toBe(true);
    });

    it('typed email only is not identity', async () => {
      const admin = await setup({ id: LEARNER_ID, email: LEARNER, email_confirmed_at: null });
      const res = await readJson(await redeem(admin, { code: CODES.valid, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'available',
      );

      const typed = await verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity: { email: LEARNER, emailConfirmed: false },
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
      });
      expect(typed.ok).toBe(false);
      expect(typed.reason).toBe(REASONS.unverified_identity);
    });

    it('wrong program_route', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongRoute, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_program_route)).toBe(true);
      expect(admin.tables.intern_progress).toHaveLength(0);
    });

    it('returning learner with an existing entitlement bypasses redemption', async () => {
      const admin = await setup();
      const grantor = createMockL1Grantor();
      await grantor.grant({
        userId: LEARNER_ID,
        row: { offering_id: 'financial-literacy', level: 'L1', program_route: 'spike-interns', versa_lead_ref: 'lead-valid' },
      });
      const result = await verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identityProvider: createSessionIdentityProvider({
          userId: LEARNER_ID,
          email: LEARNER,
          emailConfirmed: true,
        }),
        grantor,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
      });
      expect(result.ok).toBe(true);
      expect(result.alreadyGranted).toBe(true);
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'available',
      );
    });
  });

  it('mock Versa handoff identity matches versa_lead_ref', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const result = await verifyVersaCode({
      env: FLAG_ENV,
      admin,
      submittedCode: CODES.valid,
      identityProvider: createMockVersaHandoffIdentityProvider({
        versaLeadRef: 'lead-valid',
        verified: true,
        userId: 'user-handoff',
        verifiedEmail: LEARNER,
      }),
      grantor: createMockL1Grantor(),
      expected: { level: 'L1', programRoute: 'spike-interns' },
      consume: true,
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toBe(REASONS.valid);
  });

  it('L2 mock grantor requires paymentVerified from the authorized provider, never the CSV', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const unpaid = await verifyVersaCode({
      env: FLAG_ENV,
      admin,
      submittedCode: CODES.wrongLevel,
      identityProvider: createSessionIdentityProvider({
        userId: LEARNER_ID,
        email: LEARNER,
        emailConfirmed: true,
      }),
      grantor: createMockL2Grantor({ paymentVerified: false }),
      expected: { level: 'L2' },
      paymentVerified: false,
      consume: true,
    });
    expect(unpaid.ok).toBe(false);
    expect(unpaid.reason).toBe(REASONS.gate_unsatisfied);

    const paid = await verifyVersaCode({
      env: FLAG_ENV,
      admin,
      submittedCode: CODES.wrongLevel,
      identityProvider: createSessionIdentityProvider({
        userId: LEARNER_ID,
        email: LEARNER,
        emailConfirmed: true,
      }),
      grantor: createMockL2Grantor({ paymentVerified: true }),
      expected: { level: 'L2' },
      paymentVerified: true,
      consume: true,
    });
    expect(paid.ok).toBe(true);
    expect(paid.row.level).toBe('L2');
  });

  it('rate limit fails closed when versa_rate_limits is missing', async () => {
    const admin = createMemoryAdmin({ missingRateLimits: true });
    const limited = await assertDurableRateLimit({ admin, key: 'user:x' });
    expect(limited.ok).toBe(false);
    expect(limited.reason).toBe(REASONS.rate_limited);
  });

  it('concurrency: only one redeem consumes an available row', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const identity = { userId: LEARNER_ID, email: LEARNER, emailConfirmed: true };
    const row = admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-once');
    const [consumedA, consumedB] = await Promise.all([
      consumeInventoryRow(admin, { id: row.id, userId: 'user-race-a' }),
      consumeInventoryRow(admin, { id: row.id, userId: 'user-race-b' }),
    ]);
    expect([consumedA, consumedB].filter(Boolean)).toHaveLength(1);

    const [first, second] = await Promise.all([
      verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
      }),
      verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
      }),
    ]);
    const wins = [first, second].filter((result) => result.ok && result.reason === REASONS.valid);
    const repeats = [first, second].filter(
      (result) => result.reason === REASONS.reused || result.reason === REASONS.already_granted,
    );
    expect(wins.length + repeats.length).toBe(2);
    expect(wins.length).toBeLessThanOrEqual(1);
  });

  it('authenticated redeem path is idempotent for the same learner', async () => {
    const admin = createMemoryAdmin({ authUser: verifiedAuthUser() });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const first = await readJson(await redeem(admin, { code: CODES.valid, programRoute: 'spike-interns' }));
    expect(first.status).toBe(200);
    const second = await readJson(await redeem(admin, { code: CODES.valid, programRoute: 'spike-interns' }));
    expect(second.status).toBe(200);
    expect(second.body.alreadyGranted).toBe(true);
    expect(admin.tables.intern_progress).toHaveLength(0);
  });

  it('staff import accepts a custom columnMap and never returns raw codes', async () => {
    const admin = createMemoryAdmin();
    const csv = `Access Token,Lead,Verified Contact,Tier,Offer,State
${CODES.valid},lead-map,${LEARNER},L1,financial-literacy,available
`;
    const result = await handleVersaImport(
      {
        request: postJson('https://portal.test/api/versa/import', {
          csv,
          columnMap: {
            code: 'Access Token',
            versaLeadRef: 'Lead',
            verifiedEmail: 'Verified Contact',
            level: 'Tier',
            offeringId: 'Offer',
            status: 'State',
          },
        }),
        env: FLAG_ENV,
      },
      {
        verifyAdminActor: async () => ({ user: { id: 'staff-1' }, profile: { id: 'staff-1', role: 'ADMIN' } }),
        createServiceClient: () => admin,
      },
    );
    const payload = await readJson(result);
    expect(payload.status).toBe(200);
    expect(payload.body.imported).toBe(1);
    const serialized = JSON.stringify(payload.body);
    expect(serialized).not.toContain(CODES.valid);
  });

  it('stores a digest rather than plaintext and logs never include raw codes', async () => {
    const admin = createMemoryAdmin({ authUser: verifiedAuthUser() });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const digest = await digestCode(HMAC, CODES.valid);
    expect(admin.tables.versa_code_inventory.some((r) => r.code_digest === digest)).toBe(true);
    expect(admin.tables.versa_code_inventory.every((r) => !r.code)).toBe(true);
    await redeem(admin, { code: CODES.valid, programRoute: 'spike-interns' });
    const blob = capturedLogs.join('\n');
    for (const raw of Object.values(CODES)) {
      expect(blob).not.toContain(raw);
    }
    expect(blob).not.toContain(HMAC);
  });
});
