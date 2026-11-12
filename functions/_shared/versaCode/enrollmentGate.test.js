import { readFile } from 'node:fs/promises';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { handleVersaImport } from '../../api/versa/import.js';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import { createSessionIdentityProvider } from './adapters.js';
import { loadColumnMapFromEnv, mergeColumnMaps } from './columnMap.js';
import { GENERIC_DENY_MESSAGE, REASONS } from './constants.js';
import { versaHttpDenyBody } from './httpDeny.js';
import {
  ENROLLMENT_STATE_COPY,
  ENROLLMENT_UI_STATES,
  enrollmentUiMessage,
  enrollmentUiState,
  hasProgramEntitlement,
} from './enrollmentUi.js';
import { isVersaCsvCodeGateEnabled } from './flag.js';
import { importVersaCsv } from './importRows.js';
import { registerOffering, resolveIntended, resolveOfferingPolicy } from './offerings.js';
import { resetVersaRateLimitStore } from './rateLimit.js';
import { redeem, verify } from './service.js';
import { parseVersaSpreadsheet } from './spreadsheet.js';
import { createMemoryAdmin } from './test/memoryAdmin.js';
import { versaLocalDemoPlugin } from '../../../scripts/vite-versa-local-demo.mjs';

const HMAC = 'spike-versa-synthetic-hmac-secret';
const FLAG_ENV = {
  VERSA_CSV_CODE_GATE: '1',
  VERSA_CODE_HMAC_SECRET: HMAC,
};

const LEARNER = 'learner.valid@example.test';
const LEARNER_ID = 'user-l1-1';
const RA_LEARNER = 'ra.learner@example.test';
const RA_ID = 'user-ra-1';

function postJson(url, body) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  return { status: response.status, body: await response.json() };
}

function verifiedAuthUser({ id = LEARNER_ID, email = LEARNER } = {}) {
  return { id, email, email_confirmed_at: '2026-01-01T00:00:00.000Z' };
}

function identity(id = LEARNER_ID, email = LEARNER) {
  return createSessionIdentityProvider({ userId: id, email, emailConfirmed: true });
}

async function loadCsv() {
  return readFile(new URL('../../../docs/versa/synthetic-enrollment.csv', import.meta.url), 'utf8');
}

async function setup(authUser = verifiedAuthUser()) {
  const admin = createMemoryAdmin({ authUser });
  const imported = await importVersaCsv({ env: FLAG_ENV, admin, csvText: await loadCsv() });
  expect(imported.ok).toBe(true);
  return admin;
}

describe('portable Versa verify/redeem', () => {
  beforeEach(() => {
    resetVersaRateLimitStore();
  });

  afterEach(() => {
    resetVersaRateLimitStore();
  });

  it('maps reasons onto the standalone activation UI states', () => {
    expect(ENROLLMENT_UI_STATES).toEqual([
      'success',
      'invalid',
      'expired',
      'already-redeemed',
      'identity-mismatch',
      'wrong-course-level',
      'free-no-code',
    ]);
    expect(enrollmentUiState({ ok: true, reason: REASONS.valid })).toBe('success');
    expect(enrollmentUiState({ ok: true, reason: REASONS.code_not_required })).toBe('free-no-code');
    expect(enrollmentUiState({ ok: false, reason: REASONS.expired })).toBe('expired');
    expect(enrollmentUiState({ ok: false, reason: REASONS.reused })).toBe('already-redeemed');
    expect(enrollmentUiState({ ok: false, reason: REASONS.wrong_identity })).toBe('identity-mismatch');
    expect(enrollmentUiState({ ok: false, reason: REASONS.wrong_program_route })).toBe('wrong-course-level');
    expect(enrollmentUiState({ ok: false, reason: REASONS.wrong_offering })).toBe('wrong-course-level');
    expect(enrollmentUiMessage('free-no-code')).toBe(ENROLLMENT_STATE_COPY['free-no-code']);
  });

  it('does not treat intern Financial Literacy as RA-SPIKE access', () => {
    expect(
      hasProgramEntitlement([{ program_route: 'spike-interns', offering_id: 'financial-literacy' }], 'ra-spike'),
    ).toBe(false);
  });

  it('client/server flags default off; demo plugin is opt-in', () => {
    expect(isVersaCsvCodeGateEnabled({})).toBe(false);
    const prev = process.env.VERSA_DEMO_LOCAL;
    delete process.env.VERSA_DEMO_LOCAL;
    expect(versaLocalDemoPlugin().name).toBe('versa-local-demo-skipped');
    process.env.VERSA_DEMO_LOCAL = prev;
  });

  it('CSV/xlsx column mapping stays in a config layer', () => {
    const envMap = loadColumnMapFromEnv({
      VERSA_CSV_COLUMN_MAP: JSON.stringify({ code: 'Access Token' }),
    });
    expect(mergeColumnMaps(envMap, { versaLeadRef: 'Lead' })).toMatchObject({
      code: 'Access Token',
      versaLeadRef: 'Lead',
    });
    expect(loadColumnMapFromEnv({ VERSA_CSV_COLUMN_MAP: 'nope' })).toEqual({});
  });

  it('intern-signup, RA signup, and Gate 1/2 stay Versa-free', async () => {
    const internSignup = await readFile(new URL('../../api/auth/intern-signup.js', import.meta.url), 'utf8');
    const raSignup = await readFile(new URL('../../_shared/raSpikeSignupHandler.js', import.meta.url), 'utf8');
    const gateService = await readFile(new URL('../../../src/lib/raSpikeGateService.js', import.meta.url), 'utf8');
    const internPortal = await readFile(new URL('../../../src/SpikeMasterPortal.jsx', import.meta.url), 'utf8');
    const raApp = await readFile(new URL('../../../src/apps/ra-spike/RaSpikeApp.jsx', import.meta.url), 'utf8');
    expect(internSignup.toLowerCase()).not.toContain('versa');
    expect(raSignup.toLowerCase()).not.toContain('versa');
    expect(gateService.toLowerCase()).not.toContain('versa');
    expect(internPortal).not.toContain('VersaEnrollmentGuard');
    expect(raApp).not.toContain('VersaEnrollmentGuard');
  });

  it('free L1 Financial Literacy and free FEP need no code', async () => {
    const admin = await setup();
    const literacy = await verify('', identity(), 'financial-literacy', 'L1', { env: FLAG_ENV, admin });
    expect(literacy.ok).toBe(true);
    expect(literacy.reason).toBe(REASONS.code_not_required);
    expect(enrollmentUiState(literacy)).toBe('free-no-code');

    const fep = await verify('', identity(), 'fep', 'L1', { env: FLAG_ENV, admin });
    expect(fep.ok).toBe(true);
    expect(fep.reason).toBe(REASONS.code_not_required);
    expect(admin.tables.intern_progress).toHaveLength(0);
    expect(admin.tables.versa_entitlements).toHaveLength(0);
  });

  it('paid L2 still requires a code; an imported PRO code is the payment signal', async () => {
    const admin = await setup();
    const missing = await redeem('', identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
    });
    expect(missing.ok).toBe(false);

    const paid = await redeem('PRO-SYN00001', identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
      paymentVerified: false,
    });
    expect(paid.ok).toBe(true);
    expect(paid.row.level).toBe('L2');
  });

  it('future offering-specific codes register on the catalog', () => {
    const policy = registerOffering({
      id: 'future-coded-offer',
      level: 'L1',
      requiresCode: true,
      label: 'Future coded',
    });
    expect(resolveOfferingPolicy('future-coded-offer', 'L1').requiresCode).toBe(true);
    expect(policy.requiresCode).toBe(true);
    expect(resolveIntended('spike-interns', 'L1').offeringId).toBe('financial-literacy');
  });

  describe('activation states via verify/redeem', () => {
    it('success: intern L1 code grants intern entitlement only', async () => {
      const admin = await setup();
      const result = await redeem('FREE-SYN00001', identity(), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(result.ok).toBe(true);
      expect(enrollmentUiState(result)).toBe('success');
      expect(result.row.program_route).toBe('spike-interns');
      expect(admin.tables.intern_progress).toHaveLength(0);
      expect(admin.tables.versa_entitlements.every((row) => row.program_route === 'spike-interns')).toBe(true);
      expect(admin.tables.versa_entitlements.map((row) => row.offering_id).sort()).toEqual([
        'fep',
        'financial-literacy',
      ]);
    });

    it('invalid: unknown code', async () => {
      const admin = await setup();
      const result = await verify('FREE-SYN99999', identity(), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(result.ok).toBe(false);
      expect(enrollmentUiState(result)).toBe('invalid');
    });

    it('expired', async () => {
      const admin = await setup();
      const result = await redeem('FREE-SYNEXP01', identity(), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe(REASONS.expired);
      expect(enrollmentUiState(result)).toBe('expired');
    });

    it('already redeemed', async () => {
      const admin = await setup();
      const result = await redeem('FREE-SYNREUSE', identity(), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(result.ok).toBe(false);
      expect(enrollmentUiState(result)).toBe('already-redeemed');
    });

    it('identity mismatch', async () => {
      const admin = await setup();
      await redeem('FREE-SYN00001', identity(), 'spike-interns', 'L1', { env: FLAG_ENV, admin });
      const result = await redeem('FREE-SYN00001', identity(RA_ID, RA_LEARNER), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(result.ok).toBe(false);
      expect(enrollmentUiState(result)).toBe('already-redeemed');
    });

    it('wrong course/level', async () => {
      const admin = await setup();
      const wrongCourse = await redeem('FREE-SYNONCE1', identity(), 'ra-spike', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(wrongCourse.ok).toBe(false);
      expect(enrollmentUiState(wrongCourse)).toBe('wrong-course-level');

      const wrongLevel = await redeem('PRO-SYN00001', identity(), 'spike-interns', 'L1', {
        env: FLAG_ENV,
        admin,
      });
      expect(wrongLevel.ok).toBe(false);
      expect(enrollmentUiState(wrongLevel)).toBe('wrong-course-level');
    });
  });

  it('a code for program X never grants program Y', async () => {
    const internAdmin = await setup();
    const internGrant = await redeem('FREE-SYN00001', identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin: internAdmin,
    });
    expect(internGrant.ok).toBe(true);

    const internAsRa = await redeem('FREE-SYNONCE1', identity(), 'ra-spike', 'L1', {
      env: FLAG_ENV,
      admin: internAdmin,
    });
    expect(internAsRa.ok).toBe(false);
    expect(internAsRa.reason).toBe(REASONS.wrong_program_route);
    expect(internAdmin.tables.versa_entitlements.some((row) => row.program_route === 'ra-spike')).toBe(false);
    expect(internAdmin.tables.intern_progress).toHaveLength(0);
  });

  it('existing intern entitlement is preserved when a wrong-course redeem is rejected', async () => {
    const admin = await setup();
    await redeem('FREE-SYN00001', identity(), 'spike-interns', 'L1', { env: FLAG_ENV, admin });
    const before = JSON.parse(JSON.stringify(admin.tables.versa_entitlements));
    await redeem('FREE-SYNONCE1', identity(), 'ra-spike', 'L1', { env: FLAG_ENV, admin });
    expect(admin.tables.versa_entitlements).toEqual(before);
  });

  it('HTTP redeem uses a generic deny body and does not grant intern_progress', async () => {
    const admin = await setup();
    const mismatch = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: 'FREE-SYN99999',
            intendedCourse: 'spike-interns',
            intendedLevel: 'L1',
          }),
          env: FLAG_ENV,
        },
        {
          createServiceClient: () => admin,
          createUserClient: () => admin,
        },
      ),
    );
    expect(mismatch.status).toBe(403);
    expect(mismatch.body).toEqual(versaHttpDenyBody());
    expect(mismatch.body).not.toHaveProperty('state');
    expect(admin.tables.intern_progress).toHaveLength(0);
  });

  it('xlsx is declared so npm ci installs it', async () => {
    const pkg = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
    expect(pkg.dependencies.xlsx).toMatch(/^\^?0\./);
  });

  it('accepts .xlsx through the same columnMap as CSV', async () => {
    let XLSX;
    try {
      XLSX = await import('xlsx');
    } catch {
      console.info('xlsx module is not installed; skipping spreadsheet import test.');
      return;
    }
    const rows = [
      ['Code', 'Plan', 'PlanSlug', 'Owner', 'SiteName', 'Inventory', 'Status', 'PurchasedAt', 'DurationDays', 'UnitPriceTokens', 'CreatedAt'],
      ['FREE-SYN00001', 'CRM Free', 'free', '', '', 'Unsold', 'INACTIVE', '', '', '', '2026-01-01T00:00:00.000Z'],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'codes');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsed = await parseVersaSpreadsheet(buffer);
    expect(parsed.ok).toBe(true);
    expect(parsed.records).toHaveLength(1);

    const admin = createMemoryAdmin();
    const result = await handleVersaImport(
      {
        request: postJson('https://portal.test/api/versa/import', {
          xlsxBase64: Buffer.from(buffer).toString('base64'),
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
    expect(JSON.stringify(payload.body)).not.toContain('FREE-SYN00001');
  });
});
