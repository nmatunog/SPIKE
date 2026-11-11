import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getActivationDateKey } from '../activationCode.js';
import { handleInternSignup } from '../../api/auth/intern-signup.js';
import { handleVersaImport } from '../../api/versa/import.js';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import { ASSUMED_CSV_COLUMNS, GENERIC_DENY_MESSAGE, HEADER_ALIASES, REASONS } from './constants.js';
import { parseVersaCsv } from './csv.js';
import { digestCode, requireHmacSecret } from './digest.js';
import { importVersaCsv } from './importRows.js';
import { consumeInventoryRow } from './inventory.js';
import { resetVersaRateLimitStore } from './rateLimit.js';
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

function internSignupDeps(admin, { userId = 'user-intern-1' } = {}) {
  return {
    createServiceClient: () => admin,
    createConfirmedPortalUser: async (_svc, input) => {
      internSignupDeps.lastCreate = input;
      return userId;
    },
    validateInternActivationCode: async () => {
      throw new Error('daily intern code path should not run when Versa flag is on');
    },
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

async function redeem(admin, { code, level } = {}) {
  return handleVersaRedeem(
    {
      request: postJson('https://portal.test/api/versa/redeem', { code, level }),
      env: FLAG_ENV,
    },
    redeemDeps(admin),
  );
}

describe('Versa CSV verification (Checkpoint 01 / Q1 hardening)', () => {
  let restoreLogs;

  beforeEach(() => {
    resetVersaRateLimitStore();
    internSignupDeps.lastCreate = null;
    restoreLogs = installLogCapture();
  });

  afterEach(() => {
    restoreLogs?.();
  });

  it('documents assumed CSV columns for Versa (not yet agreed)', () => {
    expect(ASSUMED_CSV_COLUMNS).toMatchObject({
      code: 'code',
      versaLeadRef: 'versa_lead_ref',
      verifiedEmail: 'verified_email',
      level: 'level',
      offeringId: 'offering_id',
      status: 'status',
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
    expect(HMAC.length).toBeGreaterThanOrEqual(32);
  });

  it('intern-signup is unchanged when the flag is off', async () => {
    const today = getActivationDateKey();
    const admin = createMemoryAdmin({
      activation_codes: [
        { date_key: today, code: 'DAILYOK', expires_at: new Date(Date.now() + 60_000).toISOString() },
      ],
    });
    const res = await handleInternSignup(
      {
        request: postJson('https://portal.test/api/auth/intern-signup', {
          name: 'Synthetic Intern',
          email: LEARNER,
          password: 'password123',
          code: 'DAILYOK',
        }),
        env: {},
      },
      {
        createServiceClient: () => admin,
        createConfirmedPortalUser: async () => 'user-flag-off',
      },
    );
    const payload = await readJson(res);
    expect(payload.status).toBe(200);
    expect(payload.body).toEqual({ ok: true, userId: 'user-flag-off' });
    expect(admin.tables.intern_progress).toHaveLength(1);
    expect(admin.tables.versa_code_inventory).toHaveLength(0);
  });

  it('flag on: intern-signup creates an unconfirmed account and never consumes a typed code', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const res = await readJson(
      await handleInternSignup(
        {
          request: postJson('https://portal.test/api/auth/intern-signup', {
            name: 'Synthetic Learner',
            email: LEARNER,
            password: 'password123',
            code: CODES.valid,
          }),
          env: FLAG_ENV,
        },
        internSignupDeps(admin, { userId: 'user-unconfirmed' }),
      ),
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.versaRedeemRequired).toBe(true);
    expect(internSignupDeps.lastCreate.emailConfirm).toBe(false);
    expect(admin.tables.intern_progress).toHaveLength(0);
    expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
      'available',
    );
  });

  it('client daily-code fallback is disabled (fail closed)', async () => {
    const { readFile } = await import('node:fs/promises');
    const src = await readFile(new URL('../../../src/lib/internSignupService.js', import.meta.url), 'utf8');
    expect(src).toContain('export function clientDailyActivationFallbackAllowed()');
    expect(src).toContain('return false;');
  });

  it('identity match requires a verified session, not a typed email', () => {
    const row = { verified_email: LEARNER, verified_user_id: null };
    expect(identityMatchesImportedRow(row, { email: LEARNER })).toBe(false);
    expect(identityMatchesImportedRow(row, { userId: LEARNER_ID, email: LEARNER, emailConfirmed: false })).toBe(
      false,
    );
    expect(identityMatchesImportedRow(row, { userId: LEARNER_ID, email: LEARNER, emailConfirmed: true })).toBe(
      true,
    );
    expect(
      identityMatchesImportedRow(
        { verified_email: null, verified_user_id: VERIFIED_USER_ID },
        { userId: VERIFIED_USER_ID, email: OTHER, emailConfirmed: false },
      ),
    ).toBe(true);
  });

  describe('6-case matrix through authenticated /api/versa/redeem (verified session)', () => {
    async function setup(authUser = verifiedAuthUser()) {
      const admin = createMemoryAdmin({ authUser });
      const imported = await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
      expect(imported.ok).toBe(true);
      expect(imported.imported).toBe(8);
      return admin;
    }

    it('valid: verified session identity + L1 spike-interns grants intern entitlement', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.valid }));
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.level).toBe('L1');
      expect(res.body.confirmation).toContain('Financial Literacy (L1)');
      expect(res.body.continueLabel).toBe('Continue to SPIKE Learning');
      expect(admin.tables.intern_progress[0]).toMatchObject({
        user_id: LEARNER_ID,
        program_slug: 'spike-internship',
      });
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'redeemed',
      );
    });

    it('wrong identity: code exists but verified link does not match the session', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongIdentity }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.intern_progress).toHaveLength(0);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_identity)).toBe(true);
    });

    it('wrong level/offering: L2 row is not accepted at intern L1 entry', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongLevel }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_offering)).toBe(true);
    });

    it('unknown: unregistered code is denied', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.unknown }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.unknown)).toBe(true);
    });

    it('reused: already consumed row is denied', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.reused }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.reused)).toBe(true);
    });

    it('revoked/invalid: revoked row is denied', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.revoked }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.revoked)).toBe(true);
    });

    it('typed email is not identity: unverified session cannot redeem', async () => {
      const admin = await setup({ id: LEARNER_ID, email: LEARNER, email_confirmed_at: null });
      const res = await readJson(await redeem(admin, { code: CODES.valid }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'available',
      );
      expect(admin.tables.intern_progress).toHaveLength(0);

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

    it('fallback bypass: intern-signup with the flag on cannot redeem via daily intern code', async () => {
      const today = getActivationDateKey();
      const admin = await setup();
      admin.tables.activation_codes.push({
        date_key: today,
        code: 'DAILYOK',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      });
      const res = await readJson(
        await handleInternSignup(
          {
            request: postJson('https://portal.test/api/auth/intern-signup', {
              name: 'Synthetic Learner',
              email: LEARNER,
              password: 'password123',
              code: 'DAILYOK',
            }),
            env: FLAG_ENV,
          },
          internSignupDeps(admin, { userId: 'user-bypass' }),
        ),
      );
      expect(res.status).toBe(200);
      expect(res.body.versaRedeemRequired).toBe(true);
      expect(admin.tables.intern_progress).toHaveLength(0);
    });

    it('wrong program_route: ra-spike L1 row does not grant spike-internship', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongRoute }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.intern_progress).toHaveLength(0);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_program_route)).toBe(true);
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-route').status).toBe(
        'available',
      );
    });
  });

  it('verified_user_id match redeems without a confirmed email', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: VERIFIED_USER_ID, email: OTHER, email_confirmed_at: null },
    });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const res = await readJson(await redeem(admin, { code: CODES.verifiedUser }));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(admin.tables.intern_progress[0].user_id).toBe(VERIFIED_USER_ID);
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
    expect([consumedA, consumedB].filter((item) => item == null)).toHaveLength(1);
    expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-once').status).toBe('redeemed');

    const [first, second] = await Promise.all([
      verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
        grantIntern: true,
      }),
      verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity,
        expected: { level: 'L1', programRoute: 'spike-interns' },
        consume: true,
        grantIntern: true,
      }),
    ]);
    const wins = [first, second].filter((result) => result.ok && result.reason === REASONS.valid);
    const repeats = [first, second].filter(
      (result) => result.reason === REASONS.reused || result.reason === REASONS.already_granted,
    );
    expect(wins.length + repeats.length).toBe(2);
    expect(wins.length).toBeLessThanOrEqual(1);
    expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe('redeemed');
    expect(
      admin.tables.versa_entitlements.filter(
        (e) => e.offering_id === 'financial-literacy' && e.user_id === LEARNER_ID,
      ),
    ).toHaveLength(1);
  });

  it('L2 CSV match is not payment proof', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const result = await verifyVersaCode({
      env: FLAG_ENV,
      admin,
      submittedCode: CODES.wrongLevel,
      identity: { userId: 'user-l2', email: LEARNER, emailConfirmed: true },
      expected: { level: 'L2', programRoute: 'spike-interns' },
      paymentVerified: false,
      consume: true,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(REASONS.gate_unsatisfied);
  });

  it('authenticated redeem path grants once and is idempotent for the same learner', async () => {
    const admin = createMemoryAdmin({
      authUser: verifiedAuthUser(),
    });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const first = await readJson(await redeem(admin, { code: CODES.valid }));
    expect(first.status).toBe(200);
    expect(first.body.confirmation).toContain('Financial Literacy (L1)');
    const second = await readJson(await redeem(admin, { code: CODES.valid }));
    expect(second.status).toBe(200);
    expect(second.body.alreadyGranted).toBe(true);
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
    expect(serialized).not.toContain('Access Token');
  });

  it('stores a digest rather than plaintext and logs never include raw codes', async () => {
    const admin = createMemoryAdmin({ authUser: verifiedAuthUser() });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const digest = await digestCode(HMAC, CODES.valid);
    expect(admin.tables.versa_code_inventory.some((r) => r.code_digest === digest)).toBe(true);
    expect(admin.tables.versa_code_inventory.every((r) => !r.code)).toBe(true);

    await handleInternSignup(
      {
        request: postJson('https://portal.test/api/auth/intern-signup', {
          name: 'Synthetic Learner',
          email: LEARNER,
          password: 'password123',
          code: CODES.valid,
        }),
        env: FLAG_ENV,
      },
      internSignupDeps(admin, { userId: 'user-log-1' }),
    );
    await redeem(admin, { code: CODES.valid });

    const blob = capturedLogs.join('\n');
    for (const raw of Object.values(CODES)) {
      expect(blob).not.toContain(raw);
    }
    expect(blob).not.toContain(HMAC);
  });
});
