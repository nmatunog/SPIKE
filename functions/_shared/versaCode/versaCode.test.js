import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getActivationDateKey } from '../activationCode.js';
import { handleInternSignup } from '../../api/auth/intern-signup.js';
import { handleVersaImport } from '../../api/versa/import.js';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import { ASSUMED_CSV_COLUMNS, GENERIC_DENY_MESSAGE, REASONS } from './constants.js';
import { digestCode } from './digest.js';
import { importVersaCsv } from './importRows.js';
import { consumeInventoryRow } from './inventory.js';
import { resetVersaRateLimitStore } from './rateLimit.js';
import { createMemoryAdmin } from './test/memoryAdmin.js';
import { verifyVersaCode } from './verifyRedeem.js';

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
};

const LEARNER = 'learner.valid@example.test';
const OTHER = 'other.person@example.test';

const SYNTHETIC_CSV = `code,versa_lead_ref,verified_email,level,offering_id,status
${CODES.valid},lead-valid,${LEARNER},L1,financial-literacy,available
${CODES.wrongIdentity},lead-other,${OTHER},L1,financial-literacy,available
${CODES.wrongLevel},lead-l2,${LEARNER},L2,financial-entrepreneurship,available
${CODES.reused},lead-used,${LEARNER},L1,financial-literacy,redeemed
${CODES.revoked},lead-rev,${LEARNER},L1,financial-literacy,revoked
${CODES.concurrent},lead-once,${LEARNER},L1,financial-literacy,available
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
    createConfirmedPortalUser: async () => userId,
    validateInternActivationCode: async () => {
      throw new Error('daily intern code path should not run when Versa flag is on');
    },
  };
}

describe('Versa CSV verification (Checkpoint 01)', () => {
  let restoreLogs;

  beforeEach(() => {
    resetVersaRateLimitStore();
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

  describe('6-case matrix through intern-signup (flag on)', () => {
    async function setup() {
      const admin = createMemoryAdmin();
      const imported = await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
      expect(imported.ok).toBe(true);
      expect(imported.imported).toBe(6);
      return admin;
    }

    async function signup(admin, { code, email = LEARNER, userId = 'user-l1-1' }) {
      return handleInternSignup(
        {
          request: postJson('https://portal.test/api/auth/intern-signup', {
            name: 'Synthetic Learner',
            email,
            password: 'password123',
            code,
          }),
          env: FLAG_ENV,
        },
        internSignupDeps(admin, { userId }),
      );
    }

    it('valid: matching code + verified identity + L1 grants existing intern entitlement', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.valid }));
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.versa.level).toBe('L1');
      expect(res.body.versa.confirmation).toContain('Financial Literacy (L1)');
      expect(admin.tables.intern_progress[0]).toMatchObject({
        user_id: 'user-l1-1',
        program_slug: 'spike-internship',
      });
      expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe(
        'redeemed',
      );
    });

    it('wrong identity: code exists but verified link does not match', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.wrongIdentity, email: LEARNER }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.intern_progress).toHaveLength(0);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_identity)).toBe(true);
    });

    it('wrong level/offering: L2 row is not accepted at intern L1 entry', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.wrongLevel }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_offering)).toBe(true);
    });

    it('unknown: unregistered code is denied', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.unknown }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.unknown)).toBe(true);
    });

    it('reused: already consumed row is denied', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.reused }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.reused)).toBe(true);
    });

    it('revoked/invalid: revoked row is denied', async () => {
      const admin = await setup();
      const res = await readJson(await signup(admin, { code: CODES.revoked }));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(GENERIC_DENY_MESSAGE);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.revoked)).toBe(true);
    });
  });

  it('concurrency: only one redeem consumes an available row', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const identity = { userId: 'user-l1-1', email: LEARNER };
    const row = admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-once');
    const [consumedA, consumedB] = await Promise.all([
      consumeInventoryRow(admin, { id: row.id, userId: identity.userId }),
      consumeInventoryRow(admin, { id: row.id, userId: identity.userId }),
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
        expected: { level: 'L1' },
        consume: true,
      }),
      verifyVersaCode({
        env: FLAG_ENV,
        admin,
        submittedCode: CODES.valid,
        identity,
        expected: { level: 'L1' },
        consume: true,
      }),
    ]);
    const wins = [first, second].filter((result) => result.ok && result.reason === REASONS.valid);
    const repeats = [first, second].filter(
      (result) => result.reason === REASONS.reused || result.reason === REASONS.already_granted,
    );
    expect(wins.length + repeats.length).toBe(2);
    expect(wins.length).toBeLessThanOrEqual(1);
    expect(admin.tables.versa_code_inventory.find((r) => r.versa_lead_ref === 'lead-valid').status).toBe('redeemed');
    expect(admin.tables.versa_entitlements.filter((e) => e.offering_id === 'financial-literacy')).toHaveLength(1);
  });

  it('L2 CSV match is not payment proof', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const result = await verifyVersaCode({
      env: FLAG_ENV,
      admin,
      submittedCode: CODES.wrongLevel,
      identity: { userId: 'user-l2', email: LEARNER },
      expected: { level: 'L2' },
      paymentVerified: false,
      consume: true,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(REASONS.gate_unsatisfied);
  });

  it('authenticated redeem path grants once and is idempotent for the same learner', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: 'user-l1-1', email: LEARNER },
    });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const deps = {
      createServiceClient: () => admin,
      createUserClient: () => admin,
    };
    const first = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', { code: CODES.valid }),
          env: FLAG_ENV,
        },
        deps,
      ),
    );
    expect(first.status).toBe(200);
    expect(first.body.confirmation).toContain('Financial Literacy (L1)');
    const second = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', { code: CODES.valid }),
          env: FLAG_ENV,
        },
        deps,
      ),
    );
    expect(second.status).toBe(200);
    expect(second.body.alreadyGranted).toBe(true);
  });

  it('staff import accepts a custom columnMap and never returns raw codes', async () => {
    const admin = createMemoryAdmin();
    const csv = `Access Token,Lead,Contact,Tier,Offer,State
${CODES.valid},lead-map,${LEARNER},L1,financial-literacy,available
`;
    const result = await handleVersaImport(
      {
        request: postJson('https://portal.test/api/versa/import', {
          csv,
          columnMap: {
            code: 'Access Token',
            versaLeadRef: 'Lead',
            verifiedEmail: 'Contact',
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
    const admin = createMemoryAdmin();
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

    const blob = capturedLogs.join('\n');
    for (const raw of Object.values(CODES)) {
      expect(blob).not.toContain(raw);
    }
    expect(blob).not.toContain(HMAC);
  });
});
