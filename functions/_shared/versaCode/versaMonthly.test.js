import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import { createSessionIdentityProvider } from './adapters.js';
import { REASONS } from './constants.js';
import {
  MS_PER_DAY,
  entitlementAccessState,
  entitlementCovers,
  lapseExpiredVersaEntitlements,
  stackedExpiryIso,
} from './entitlement.js';
import { importVersaCsv } from './importRows.js';
import { resetVersaRateLimitStore } from './rateLimit.js';
import { redeem } from './service.js';
import { createMemoryAdmin } from './test/memoryAdmin.js';
import { SYNTHETIC_CODES, versaExportCsv } from './test/versaExportCsv.js';

const HMAC = 'spike-versa-synthetic-hmac-secret';
const FLAG_ENV = {
  VERSA_CSV_CODE_GATE: '1',
  VERSA_CODE_HMAC_SECRET: HMAC,
};
const LEARNER = 'learner.valid@example.test';
const LEARNER_ID = 'user-l1-1';
const OTHER = 'other.person@example.test';
const OTHER_ID = 'user-other-1';
const T0 = Date.parse('2026-02-01T00:00:00.000Z');
const L2 = 'financial-entrepreneurship';

function identity(id = LEARNER_ID, email = LEARNER) {
  return createSessionIdentityProvider({ userId: id, email, emailConfirmed: true });
}

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

const PRO_CSV = versaExportCsv([
  { code: SYNTHETIC_CODES.pro, plan: 'CRM Pro', planSlug: 'pro', durationDays: '7' },
  { code: SYNTHETIC_CODES.pro2, plan: 'CRM Pro', planSlug: 'pro', purchasedAt: '2026-01-01T00:00:00.000Z' },
  { code: SYNTHETIC_CODES.pro3, plan: 'CRM Pro', planSlug: 'pro' },
  { code: SYNTHETIC_CODES.pro4, plan: 'CRM Pro', planSlug: 'pro' },
]);

const FREE_CSV = versaExportCsv([
  { code: SYNTHETIC_CODES.free, plan: 'CRM Free', planSlug: 'free' },
  { code: SYNTHETIC_CODES.free2, plan: 'CRM Free', planSlug: 'free' },
]);

function l2Row(admin, userId = LEARNER_ID) {
  return admin.tables.versa_entitlements.find(
    (row) => String(row.user_id) === String(userId) && String(row.offering_id) === L2,
  );
}

describe('Versa PRO monthly term (option B, new code each month)', () => {
  beforeEach(() => {
    resetVersaRateLimitStore();
  });

  afterEach(() => {
    resetVersaRateLimitStore();
  });

  async function setup(authUser = { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' }) {
    const admin = createMemoryAdmin({ authUser });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: PRO_CSV });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: FREE_CSV });
    return admin;
  }

  it('first redeem grants 30 days from now; CSV DurationDays is ignored', async () => {
    const admin = await setup();
    const first = await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    expect(first.ok).toBe(true);
    const row = l2Row(admin);
    expect(row.expires_at).toBe(stackedExpiryIso(null, T0, 30));
    expect(new Date(row.expires_at).getTime() - T0).toBe(30 * MS_PER_DAY);
    expect(entitlementAccessState(row, { now: T0 })).toBe('active');
    expect(entitlementAccessState(row, { now: T0 + 31 * MS_PER_DAY })).toBe('grace');
    expect(entitlementCovers(row, { level: 'L3', now: T0 })).toBe(false);
    expect(entitlementCovers(row, { level: 'L2', offeringId: L2, now: T0 })).toBe(true);
  });

  it('a second code redeemed early stacks to 60 days', async () => {
    const admin = await setup();
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    const early = T0 + 10 * MS_PER_DAY;
    const second = await redeem(SYNTHETIC_CODES.pro2, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: early,
    });
    expect(second.ok).toBe(true);
    expect(new Date(l2Row(admin).expires_at).getTime() - T0).toBe(60 * MS_PER_DAY);
  });

  it('a code redeemed after expiry but within grace extends from now', async () => {
    const admin = await setup();
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    const inGrace = T0 + 32 * MS_PER_DAY;
    expect(entitlementAccessState(l2Row(admin), { now: inGrace, graceDays: 7 })).toBe('grace');
    const extended = await redeem(SYNTHETIC_CODES.pro2, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: inGrace,
    });
    expect(extended.ok).toBe(true);
    expect(l2Row(admin).expires_at).toBe(stackedExpiryIso(null, inGrace, 30));
  });

  it('after grace, access is denied until a new PRO code restores it', async () => {
    const admin = await setup();
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    const afterGrace = T0 + 38 * MS_PER_DAY;
    const row = l2Row(admin);
    expect(entitlementAccessState(row, { now: afterGrace, graceDays: 7 })).toBe('denied');
    expect(entitlementCovers(row, { level: 'L2', offeringId: L2, now: afterGrace, graceDays: 7 })).toBe(false);
    const lapse = await lapseExpiredVersaEntitlements(admin);
    expect(lapse.lapsed).toBe(0);
    expect(l2Row(admin).expires_at).toBe(row.expires_at);

    const restored = await redeem(SYNTHETIC_CODES.pro2, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: afterGrace,
    });
    expect(restored.ok).toBe(true);
    expect(entitlementAccessState(l2Row(admin), { now: afterGrace, graceDays: 7 })).toBe('active');
    expect(new Date(l2Row(admin).expires_at).getTime() - afterGrace).toBe(30 * MS_PER_DAY);
  });

  it('a reused code is denied and does not stack', async () => {
    const admin = await setup();
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    const retry = await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0 + MS_PER_DAY,
    });
    expect(retry.ok).toBe(true);
    expect(retry.alreadyGranted).toBe(true);
    expect(new Date(l2Row(admin).expires_at).getTime() - T0).toBe(30 * MS_PER_DAY);

    const other = await redeem(SYNTHETIC_CODES.pro, identity(OTHER_ID, OTHER), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0 + MS_PER_DAY,
    });
    expect(other.ok).toBe(false);
    expect(other.reason).toBe(REASONS.wrong_identity);
    expect(l2Row(admin, OTHER_ID)).toBeUndefined();
  });

  it("another user's code does not extend mine", async () => {
    const admin = await setup();
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0,
    });
    const mine = l2Row(admin).expires_at;
    const other = await redeem(SYNTHETIC_CODES.pro2, identity(OTHER_ID, OTHER), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: L2,
      now: T0 + 5 * MS_PER_DAY,
    });
    expect(other.ok).toBe(true);
    expect(l2Row(admin).expires_at).toBe(mine);
    expect(new Date(l2Row(admin, OTHER_ID).expires_at).getTime() - (T0 + 5 * MS_PER_DAY)).toBe(30 * MS_PER_DAY);
  });

  it('HTTP body cannot set the duration', async () => {
    const admin = await setup();
    const before = Date.now();
    const res = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: SYNTHETIC_CODES.pro,
            intendedCourse: 'spike-interns',
            durationDays: 1,
            periodDays: 1,
            VERSA_PRO_PERIOD_DAYS: '1',
            expiresAt: '2026-02-02T00:00:00.000Z',
            graceDays: 0,
          }),
          env: FLAG_ENV,
        },
        {
          createServiceClient: () => admin,
          createUserClient: () => admin,
        },
      ),
    );
    expect(res.status).toBe(200);
    const exp = new Date(l2Row(admin).expires_at).getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 30 * MS_PER_DAY - 5000);
    expect(exp).toBeLessThan(before + 31 * MS_PER_DAY);
  });

  it('FREE entitlements stay non-expiring and are unchanged', async () => {
    const admin = await setup();
    const first = await redeem(SYNTHETIC_CODES.free, identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
      now: T0,
    });
    expect(first.ok).toBe(true);
    const freeRows = admin.tables.versa_entitlements.filter((row) => row.user_id === LEARNER_ID);
    expect(freeRows.map((row) => row.offering_id).sort()).toEqual(['fep', 'financial-literacy']);
    expect(freeRows.every((row) => row.expires_at == null)).toBe(true);
    expect(freeRows.every((row) => entitlementAccessState(row, { now: T0 + 3650 * MS_PER_DAY }) === 'active')).toBe(
      true,
    );
    expect(freeRows.some((row) => row.offering_id === L2)).toBe(false);

    const later = await redeem(SYNTHETIC_CODES.free2, identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
      now: T0 + 40 * MS_PER_DAY,
    });
    expect(later.alreadyGranted).toBe(true);
    expect(admin.tables.versa_entitlements.filter((row) => row.offering_id === L2)).toHaveLength(0);
  });

  it('RPC-less fallback still stacks 30 days from server config', async () => {
    const admin = createMemoryAdmin({
      missingRedeemRpc: true,
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({ env: FLAG_ENV, admin, csvText: PRO_CSV });
    await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: { ...FLAG_ENV, VERSA_PRO_PERIOD_DAYS: '30' },
      admin,
      offeringId: L2,
      now: T0,
    });
    expect(new Date(l2Row(admin).expires_at).getTime() - T0).toBe(30 * MS_PER_DAY);
  });
});

describe('stackedExpiryIso', () => {
  it('uses max(now, current) + period', () => {
    const now = T0;
    expect(new Date(stackedExpiryIso(null, now, 30)).getTime()).toBe(now + 30 * MS_PER_DAY);
    expect(new Date(stackedExpiryIso(new Date(now + 20 * MS_PER_DAY).toISOString(), now, 30)).getTime()).toBe(
      now + 50 * MS_PER_DAY,
    );
    const expired = new Date(now - 2 * MS_PER_DAY).toISOString();
    expect(new Date(stackedExpiryIso(expired, now, 30)).getTime()).toBe(now + 30 * MS_PER_DAY);
  });
});
