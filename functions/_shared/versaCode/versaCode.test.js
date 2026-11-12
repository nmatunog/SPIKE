import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { handleVersaImport } from '../../api/versa/import.js';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import {
  createMockL1Grantor,
  createMockL2Grantor,
  createMockVersaHandoffIdentityProvider,
  createSessionIdentityProvider,
} from './adapters.js';
import { GENERIC_DENY_MESSAGE, HEADER_ALIASES, REASONS, VERSA_CSV_COLUMNS, VERSA_EXPORT_HEADER } from './constants.js';
import { versaHttpDenyBody } from './httpDeny.js';
import { createVersaLogger } from './log.js';
import { parseVersaCsv } from './csv.js';
import { digestCode, requireHmacSecret } from './digest.js';
import { importVersaCsv } from './importRows.js';
import { consumeInventoryRow } from './inventory.js';
import { assertDurableRateLimit, recordDurableFail, resetVersaRateLimitStore } from './rateLimit.js';
import { createMemoryAdmin } from './test/memoryAdmin.js';
import { SYNTHETIC_CODES, versaExportCsv } from './test/versaExportCsv.js';
import { identityMatchesImportedRow, verifyVersaCode } from './verifyRedeem.js';

const HMAC = 'spike-versa-synthetic-hmac-secret';
const FLAG_ENV = {
  VERSA_CSV_CODE_GATE: '1',
  VERSA_CODE_HMAC_SECRET: HMAC,
};

const CODES = {
  valid: SYNTHETIC_CODES.free,
  wrongLevel: SYNTHETIC_CODES.pro,
  unknown: SYNTHETIC_CODES.unknown,
  reused: SYNTHETIC_CODES.reused,
  revoked: SYNTHETIC_CODES.revoked,
  concurrent: SYNTHETIC_CODES.once,
  expired: SYNTHETIC_CODES.expired,
};

const LEARNER = 'learner.valid@example.test';
const LEARNER_ID = 'user-l1-1';

const SYNTHETIC_CSV = versaExportCsv([
  { code: CODES.valid, plan: 'CRM Free', planSlug: 'free' },
  { code: CODES.concurrent, plan: 'CRM Free', planSlug: 'free' },
  { code: CODES.reused, plan: 'CRM Free', planSlug: 'free', status: 'REDEEMED' },
  { code: CODES.revoked, plan: 'CRM Free', planSlug: 'free', status: 'REVOKED' },
  { code: CODES.expired, plan: 'CRM Free', planSlug: 'free', status: 'EXPIRED', createdAt: '2020-01-01T00:00:00.000Z' },
  { code: CODES.wrongLevel, plan: 'CRM Pro', planSlug: 'pro' },
  { code: SYNTHETIC_CODES.free2, plan: 'CRM Free', planSlug: 'free' },
]);

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

async function redeem(admin, body = {}) {
  return handleVersaRedeem(
    {
      request: postJson('https://portal.test/api/versa/redeem', body),
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

  it('locks the Versa export columns and does not treat Owner as identity', () => {
    expect(VERSA_CSV_COLUMNS).toMatchObject({
      code: 'Code',
      plan: 'Plan',
      planSlug: 'PlanSlug',
    });
    expect(VERSA_EXPORT_HEADER.startsWith('Code,Plan,PlanSlug')).toBe(true);
    expect(HEADER_ALIASES.code).toEqual(['code']);
    const parsed = parseVersaCsv(
      versaExportCsv([
        {
          code: CODES.valid,
          plan: 'CRM Free',
          planSlug: 'free',
          owner: LEARNER,
        },
      ]),
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.records[0].verifiedEmail).toBeNull();
    expect(parsed.records[0].owner).toBe(LEARNER);
  });

  it('requires a 32+ character HMAC secret', () => {
    expect(() => requireHmacSecret({ VERSA_CODE_HMAC_SECRET: 'x'.repeat(31) })).toThrow(/VERSA_CODE_HMAC_SECRET/);
    expect(requireHmacSecret({ VERSA_CODE_HMAC_SECRET: 'x'.repeat(32) })).toHaveLength(32);
  });

  it('intern-signup is not coupled to the Versa module', async () => {
    const src = await readFile(new URL('../../api/auth/intern-signup.js', import.meta.url), 'utf8');
    expect(src.toLowerCase()).not.toContain('versa');
  });

  it('does not keep intern-portal F1 coupling or VersaAccessCard overlay', async () => {
    const signup = await readFile(new URL('../../../src/lib/internSignupService.js', import.meta.url), 'utf8');
    expect(signup).not.toContain('clientDailyActivationFallbackAllowed');
    await expect(
      access(fileURLToPath(new URL('../../../src/components/VersaAccessCard.jsx', import.meta.url))),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('migrations never create an intern-granting redeem RPC', async () => {
    const portable = await readFile(
      new URL('../../../supabase/migrations/20260830_versa_portable_service.sql', import.meta.url),
      'utf8',
    );
    expect(portable).not.toMatch(
      /create or replace function public\.redeem_versa_code_and_grant\s*\(\s*p_id\s+bigint\s*,\s*p_user_id\s+uuid\s*,/i,
    );
    expect(portable).not.toContain('intern_progress');
    const bind = await readFile(
      new URL('../../../supabase/migrations/20260832_versa_bind_verified_user.sql', import.meta.url),
      'utf8',
    );
    expect(bind).toMatch(/verified_user_id = coalesce\(verified_user_id, p_user_id\)/);
    expect(bind).not.toContain('intern_progress');
    const monthly = await readFile(
      new URL('../../../supabase/migrations/20260833_versa_pro_monthly_term.sql', import.meta.url),
      'utf8',
    );
    expect(monthly).toMatch(/p_period_days integer default 30/);
    expect(monthly).toContain('greatest(at, coalesce(next_expiry, at))');
    expect(monthly).not.toContain('intern_progress');
    await expect(
      access(fileURLToPath(new URL('../../../supabase/migrations/20260829_versa_q1_hardening.sql', import.meta.url))),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('identity binds at redemption for unbound Versa rows; typed email is not proof', () => {
    const row = { plan_slug: 'free', verified_email: null, verified_user_id: null };
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
        versaLeadRef: 'plan:free',
      }),
    ).toBe(true);
  });

  describe('9+ case matrix on the portable verify path', () => {
    async function setup(authUser = verifiedAuthUser()) {
      const admin = createMemoryAdmin({ authUser });
      const imported = await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
      expect(imported.ok).toBe(true);
      expect(imported.imported).toBe(7);
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
      expect(grantor.grants).toHaveLength(2);
      expect(grantor.grants.map((row) => row.offeringId).sort()).toEqual(['fep', 'financial-literacy']);
      expect(grantor.grants[0]).toMatchObject({
        userId: LEARNER_ID,
        level: 'L1',
        role: null,
      });
      expect(admin.tables.intern_progress).toHaveLength(0);
      const digest = await digestCode(HMAC, CODES.valid);
      expect(admin.tables.versa_code_inventory.find((r) => r.code_digest === digest).status).toBe('redeemed');
    });

    it('unverified session cannot claim an unbound code', async () => {
      const admin = await setup({ id: LEARNER_ID, email: LEARNER, email_confirmed_at: null });
      const res = await readJson(await redeem(admin, { code: CODES.valid, programRoute: 'spike-interns' }));
      expect(res.status).toBe(403);
      expect(res.body).toEqual(versaHttpDenyBody());
      const digest = await digestCode(HMAC, CODES.valid);
      expect(admin.tables.versa_code_inventory.find((r) => r.code_digest === digest).status).toBe('available');
    });

    it('HTTP redeem infers L2 from a PRO slug without the client passing L2', async () => {
      const admin = await setup();
      const res = await readJson(await redeem(admin, { code: CODES.wrongLevel, programRoute: 'spike-interns' }));
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.level).toBe('L2');
      expect(admin.tables.versa_entitlements.map((row) => row.offering_id)).toEqual([
        'financial-entrepreneurship',
      ]);
    });

    it('HTTP client cannot raise a free code to L2', async () => {
      const admin = await setup();
      const res = await readJson(
        await redeem(admin, {
          code: CODES.valid,
          programRoute: 'spike-interns',
          intendedLevel: 'L2',
          offeringId: 'financial-entrepreneurship',
          paymentVerified: true,
        }),
      );
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
      const digest = await digestCode(HMAC, CODES.valid);
      expect(admin.tables.versa_code_inventory.find((r) => r.code_digest === digest).status).toBe('available');

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
      const res = await readJson(
        await handleVersaRedeem(
          {
            request: postJson('https://portal.test/api/versa/redeem', {
              code: CODES.valid,
              intendedCourse: 'ra-spike',
              intendedLevel: 'L1',
            }),
            env: FLAG_ENV,
          },
          redeemDeps(admin),
        ),
      );
      expect(res.status).toBe(403);
      expect(admin.tables.versa_code_attempts.some((a) => a.reason === REASONS.wrong_program_route)).toBe(true);
      expect(admin.tables.intern_progress).toHaveLength(0);
    });

    it('returning learner with an existing entitlement bypasses redemption', async () => {
      const admin = await setup();
      const grantor = createMockL1Grantor();
      await grantor.grant({
        userId: LEARNER_ID,
        row: {
          offering_id: 'financial-literacy',
          level: 'L1',
          program_route: 'spike-interns',
          versa_lead_ref: 'plan:free',
          plan_slug: 'free',
        },
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
      const digest = await digestCode(HMAC, CODES.valid);
      expect(admin.tables.versa_code_inventory.find((r) => r.code_digest === digest).status).toBe('available');
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
        versaLeadRef: 'plan:free',
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

  it('L2 mock grantor requires paymentVerified when the Nilo switch is off', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const off = { ...FLAG_ENV, VERSA_PRO_CODE_IMPLIES_PAID: '0' };
    const unpaid = await verifyVersaCode({
      env: off,
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
      env: off,
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

  it('HTTP redeem ignores body.paymentVerified; imported PRO still grants L2', async () => {
    const admin = createMemoryAdmin({ authUser: verifiedAuthUser() });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const res = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: CODES.wrongLevel,
            intendedLevel: 'L2',
            intendedCourse: 'spike-interns',
            offeringId: 'financial-entrepreneurship',
            paymentVerified: false,
          }),
          env: FLAG_ENV,
        },
        redeemDeps(admin),
      ),
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(admin.tables.versa_entitlements.map((row) => row.offering_id)).toEqual([
      'financial-entrepreneurship',
    ]);
  });

  it('HTTP deny bodies are identical across unknown, expired, already-redeemed, identity-mismatch and wrong-course codes', async () => {
    const admin = createMemoryAdmin({ authUser: verifiedAuthUser() });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const cases = [
      { code: CODES.unknown, programRoute: 'spike-interns' },
      { code: CODES.expired, programRoute: 'spike-interns' },
      { code: CODES.reused, programRoute: 'spike-interns' },
      { code: CODES.valid, intendedCourse: 'ra-spike', intendedLevel: 'L1' },
    ];
    const unverifiedAdmin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: null },
    });
    await importVersaCsv({ env: FLAG_ENV, admin: unverifiedAdmin, csvText: SYNTHETIC_CSV });
    const responses = [];
    for (const body of cases) {
      responses.push(await readJson(await redeem(admin, body)));
    }
    responses.push(
      await readJson(await redeem(unverifiedAdmin, { code: SYNTHETIC_CODES.free2, programRoute: 'spike-interns' })),
    );
    const expectedBody = versaHttpDenyBody();
    expect(expectedBody.message).toBe(GENERIC_DENY_MESSAGE);
    for (const res of responses) {
      expect(res.status).toBe(403);
      expect(res.body).toEqual(expectedBody);
      expect(res.body).not.toHaveProperty('state');
    }
    expect(new Set(responses.map((res) => JSON.stringify(res.body))).size).toBe(1);
  });

  it('redacts email, verified_email and userId in versa logs', () => {
    const lines = [];
    const logger = createVersaLogger({
      info: (line) => lines.push(line),
    });
    logger.info({
      email: LEARNER,
      verified_email: LEARNER,
      userId: LEARNER_ID,
      reason: REASONS.unknown,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain(LEARNER);
    expect(lines[0]).not.toContain(LEARNER_ID);
    expect(JSON.parse(lines[0])).toMatchObject({
      email: '[redacted]',
      verified_email: '[redacted]',
      userId: '[redacted]',
      reason: REASONS.unknown,
    });
  });

  it('rate limit fails closed when versa_rate_limits is missing', async () => {
    const admin = createMemoryAdmin({ missingRateLimits: true });
    const limited = await assertDurableRateLimit({ admin, key: 'user:x' });
    expect(limited.ok).toBe(false);
    expect(limited.reason).toBe(REASONS.rate_limited);
  });

  it('rate limit fails closed when the increment RPC is missing (no JS fallback)', async () => {
    const admin = createMemoryAdmin({ missingRateLimitRpc: true });
    await expect(recordDurableFail({ admin, key: 'user:x' })).rejects.toThrow(/fail-closed/i);
    const src = await readFile(new URL('./rateLimit.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/fail_count:\s*Number\(row\.fail_count\)\s*\+\s*1/);
    expect(src).not.toMatch(/from\('versa_rate_limits'\)\s*\.upsert/);
  });

  it('concurrency: only one redeem consumes an available row', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: SYNTHETIC_CSV });
    const identity = { userId: LEARNER_ID, email: LEARNER, emailConfirmed: true };
    const onceDigest = await digestCode(HMAC, CODES.concurrent);
    const row = admin.tables.versa_code_inventory.find((r) => r.code_digest === onceDigest);
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
    const csv = `Token,Name,Slug
${CODES.valid},CRM Free,free
`;
    const result = await handleVersaImport(
      {
        request: postJson('https://portal.test/api/versa/import', {
          csv,
          columnMap: {
            code: 'Token',
            plan: 'Name',
            planSlug: 'Slug',
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
