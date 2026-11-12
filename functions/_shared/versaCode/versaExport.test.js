import { readFile } from 'node:fs/promises';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { handleVersaRedeem } from '../../api/versa/redeem.js';
import { createSessionIdentityProvider } from './adapters.js';
import { GENERIC_DENY_MESSAGE, REASONS, VERSA_EXPORT_HEADER } from './constants.js';
import { parseVersaCsv } from './csv.js';
import { digestCode } from './digest.js';
import { importVersaCsv } from './importRows.js';
import { versaHttpDenyBody } from './httpDeny.js';
import {
  PLAN_SLUG_MAP,
  isVersaProCodeImpliesPaid,
  resolveExpectedFromPlanSlug,
  resolvePlanSlug,
} from './planSlug.js';
import { resetVersaRateLimitStore } from './rateLimit.js';
import { redeem, verify } from './service.js';
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

async function loadFixture(name) {
  return readFile(new URL(`../../../docs/versa/fixtures/${name}`, import.meta.url));
}

describe('locked Versa export schema', () => {
  beforeEach(() => {
    resetVersaRateLimitStore();
  });

  afterEach(() => {
    resetVersaRateLimitStore();
  });

  it('locks the export header and slug map', () => {
    expect(VERSA_EXPORT_HEADER).toBe(
      'Code,Plan,PlanSlug,Owner,SiteName,Inventory,Status,PurchasedAt,DurationDays,UnitPriceTokens,CreatedAt',
    );
    expect(resolvePlanSlug('free').offerings.map((row) => row.id)).toEqual(['financial-literacy', 'fep']);
    expect(resolvePlanSlug('pro').offerings.map((row) => row.id)).toEqual(['financial-entrepreneurship']);
    expect(resolvePlanSlug('vip')).toBeNull();
    expect(PLAN_SLUG_MAP.free.programRoute).toBe('spike-interns');
    expect(PLAN_SLUG_MAP.pro.programRoute).toBe('spike-interns');
    expect(isVersaProCodeImpliesPaid({})).toBe(true);
    expect(isVersaProCodeImpliesPaid({ VERSA_PRO_CODE_IMPLIES_PAID: '0' })).toBe(false);
    expect(isVersaProCodeImpliesPaid({ VERSA_PRO_CODE_IMPLIES_PAID: 'false' })).toBe(false);
    expect(
      resolveExpectedFromPlanSlug(resolvePlanSlug('pro'), { level: 'L1', programRoute: 'spike-interns' }, {
        inferFromPlanSlug: true,
      }).level,
    ).toBe('L2');
    expect(
      resolveExpectedFromPlanSlug(resolvePlanSlug('free'), { level: 'L2', offeringId: 'financial-entrepreneurship' }, {
        inferFromPlanSlug: true,
        clientSpecifiedOffering: true,
      }).level,
    ).toBe('L2');
  });

  it('parses the BOM free file and the non-BOM pro file', async () => {
    const freeBytes = await loadFixture('versa-free.csv');
    expect(freeBytes[0]).toBe(0xef);
    expect(freeBytes[1]).toBe(0xbb);
    expect(freeBytes[2]).toBe(0xbf);
    const free = parseVersaCsv(freeBytes.toString('utf8'));
    expect(free.ok).toBe(true);
    expect(free.records.map((row) => row.code)).toContain(SYNTHETIC_CODES.free);
    expect(free.records.every((row) => row.planSlug === 'free' && row.plan === 'CRM Free')).toBe(true);
    expect(free.records.find((row) => row.code === SYNTHETIC_CODES.free).status).toBe('available');
    expect(free.records.find((row) => row.code === SYNTHETIC_CODES.reused).status).toBe('redeemed');
    expect(free.records.find((row) => row.code === SYNTHETIC_CODES.expired).status).toBe('expired');

    const proBytes = await loadFixture('versa-pro.csv');
    expect(proBytes[0]).toBe(0x43); // 'C' of Code — no BOM
    const pro = parseVersaCsv(proBytes.toString('utf8'));
    expect(pro.ok).toBe(true);
    expect(pro.records).toHaveLength(2);
    expect(pro.records[0]).toMatchObject({
      code: SYNTHETIC_CODES.pro,
      plan: 'CRM Pro',
      planSlug: 'pro',
      owner: null,
      siteName: null,
      purchasedAt: null,
      durationDays: null,
      unitPriceTokens: null,
      level: 'L2',
      offeringId: 'financial-entrepreneurship',
      programRoute: 'spike-interns',
    });
  });

  it('accepts either file alone, concatenated files, and empty optional columns', async () => {
    const freeText = (await loadFixture('versa-free.csv')).toString('utf8');
    const proText = (await loadFixture('versa-pro.csv')).toString('utf8');
    const mixed = parseVersaCsv(`${freeText}\n${proText}`);
    expect(mixed.ok).toBe(true);
    expect(mixed.records.some((row) => row.planSlug === 'free')).toBe(true);
    expect(mixed.records.some((row) => row.planSlug === 'pro')).toBe(true);

    const emptyOptional = parseVersaCsv(
      versaExportCsv([{ code: 'FREE-SYN00001', plan: 'CRM Free', planSlug: 'free' }]),
    );
    expect(emptyOptional.ok).toBe(true);
    expect(emptyOptional.records[0].owner).toBeNull();
    expect(emptyOptional.records[0].inventory).toBe('Unsold');
  });

  it('rejects unknown plan slugs and does not import them', async () => {
    const parsed = parseVersaCsv((await loadFixture('versa-unknown-slug.csv')).toString('utf8'));
    expect(parsed.ok).toBe(true);
    expect(parsed.records).toHaveLength(0);
    expect(parsed.rejected.some((row) => row.reason === 'unknown_plan_slug')).toBe(true);

    const admin = createMemoryAdmin();
    const imported = await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-unknown-slug.csv')).toString('utf8'),
    });
    expect(imported.imported).toBe(0);
    expect(imported.rejected.some((row) => row.reason === 'unknown_plan_slug')).toBe(true);
  });

  it('hashes Code at rest, stores Plan/PlanSlug, and never logs plaintext', async () => {
    const logs = [];
    const admin = createMemoryAdmin();
    const csvText = (await loadFixture('versa-free.csv')).toString('utf8');
    const imported = await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText,
      logger: { info: (event) => logs.push(JSON.stringify(event)), warn() {}, error() {} },
    });
    expect(imported.ok).toBe(true);
    const digest = await digestCode(HMAC, SYNTHETIC_CODES.free);
    const row = admin.tables.versa_code_inventory.find((item) => item.code_digest === digest);
    expect(row).toMatchObject({
      plan: 'CRM Free',
      plan_slug: 'free',
      offering_id: 'financial-literacy',
      program_route: 'spike-interns',
    });
    expect(row.code).toBeUndefined();
    expect(JSON.stringify(imported.acknowledgments)).not.toContain(SYNTHETIC_CODES.free);
    expect(logs.join('\n')).not.toContain(SYNTHETIC_CODES.free);
  });

  it('rejects duplicate codes on a second import', async () => {
    const admin = createMemoryAdmin();
    const csvText = (await loadFixture('versa-pro.csv')).toString('utf8');
    const first = await importVersaCsv({ env: FLAG_ENV, admin, csvText });
    const second = await importVersaCsv({ env: FLAG_ENV, admin, csvText });
    expect(first.imported).toBe(2);
    expect(second.imported).toBe(0);
    expect(second.rejected.every((row) => row.reason === 'duplicate_digest_or_external_id')).toBe(true);
  });

  it('first verified account claims an unbound code once; a second account cannot', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-free.csv')).toString('utf8'),
    });
    const first = await redeem(SYNTHETIC_CODES.free, identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
    });
    expect(first.ok).toBe(true);
    const offerings = admin.tables.versa_entitlements.map((row) => row.offering_id).sort();
    expect(offerings).toEqual(['fep', 'financial-literacy']);
    expect(admin.tables.versa_entitlements.every((row) => row.program_route === 'spike-interns')).toBe(true);
    expect(admin.tables.intern_progress).toHaveLength(0);
    const digest = await digestCode(HMAC, SYNTHETIC_CODES.free);
    const claimed = admin.tables.versa_code_inventory.find((item) => item.code_digest === digest);
    expect(claimed.verified_user_id).toBe(LEARNER_ID);
    expect(claimed.redeemed_by).toBe(LEARNER_ID);

    const second = await redeem(SYNTHETIC_CODES.free, identity(OTHER_ID, OTHER), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
    });
    expect(second.ok).toBe(false);
    expect(second.reason).toBe(REASONS.wrong_identity);
    expect(admin.tables.versa_entitlements.every((row) => row.user_id === LEARNER_ID)).toBe(true);
  });

  it('fallback consume without the RPC still grants Literacy and FEP from plan_slug', async () => {
    const admin = createMemoryAdmin({
      missingRedeemRpc: true,
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-free.csv')).toString('utf8'),
    });
    const first = await redeem(SYNTHETIC_CODES.free, identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
    });
    expect(first.ok).toBe(true);
    expect(admin.tables.versa_entitlements.map((row) => row.offering_id).sort()).toEqual([
      'fep',
      'financial-literacy',
    ]);
    const digest = await digestCode(HMAC, SYNTHETIC_CODES.free);
    const claimed = admin.tables.versa_code_inventory.find((item) => item.code_digest === digest);
    expect(claimed.plan_slug).toBe('free');
    expect(claimed.verified_user_id).toBe(LEARNER_ID);
    expect(claimed.status).toBe('redeemed');
  });

  it('never auto-grants RA-SPIKE from a free intern pathway code', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-free.csv')).toString('utf8'),
    });
    const denied = await redeem(SYNTHETIC_CODES.free2, identity(), 'ra-spike', 'L1', {
      env: FLAG_ENV,
      admin,
    });
    expect(denied.ok).toBe(false);
    expect(denied.reason).toBe(REASONS.wrong_program_route);
    expect(admin.tables.versa_entitlements).toHaveLength(0);
  });

  it('an imported PRO code grants paid L2 once; a second redeem is denied', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const first = await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
      paymentVerified: false,
    });
    expect(first.ok).toBe(true);
    expect(first.row.level).toBe('L2');
    expect(admin.tables.versa_entitlements.map((row) => row.offering_id)).toEqual([
      'financial-entrepreneurship',
    ]);
    expect(admin.tables.versa_entitlements[0].program_route).toBe('spike-interns');
    expect(admin.tables.versa_entitlements.some((row) => row.offering_id === 'financial-literacy')).toBe(false);
    expect(admin.tables.versa_entitlements.some((row) => row.offering_id === 'fep')).toBe(false);

    const second = await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
    });
    expect(second.ok).toBe(true);
    expect(second.alreadyGranted).toBe(true);

    const other = await redeem(SYNTHETIC_CODES.pro, identity(OTHER_ID, OTHER), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
    });
    expect(other.ok).toBe(false);
    expect(other.reason).toBe(REASONS.wrong_identity);
    const digest = await digestCode(HMAC, SYNTHETIC_CODES.pro);
    expect(admin.tables.versa_code_inventory.find((item) => item.code_digest === digest).verified_user_id).toBe(
      LEARNER_ID,
    );
  });

  it('an unknown PRO-shaped code is denied', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const unknown = await redeem('PRO-SYN99999', identity(), 'spike-interns', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
    });
    expect(unknown.ok).toBe(false);
    expect(unknown.reason).toBe(REASONS.unknown);
    expect(admin.tables.versa_entitlements).toHaveLength(0);
  });

  it('HTTP redeem infers L2 from the imported PRO slug without the client passing L2', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const pasted = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: SYNTHETIC_CODES.pro,
            intendedCourse: 'spike-interns',
            paymentVerified: true,
          }),
          env: FLAG_ENV,
        },
        {
          createServiceClient: () => admin,
          createUserClient: () => admin,
        },
      ),
    );
    expect(pasted.status).toBe(200);
    expect(pasted.body.ok).toBe(true);
    expect(pasted.body.level).toBe('L2');
    expect(admin.tables.versa_entitlements.map((row) => row.offering_id)).toEqual([
      'financial-entrepreneurship',
    ]);
  });

  it('HTTP client cannot raise a free code to L2 or set payment', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-free.csv')).toString('utf8'),
    });
    const raised = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: SYNTHETIC_CODES.free,
            intendedCourse: 'spike-interns',
            intendedLevel: 'L2',
            offeringId: 'financial-entrepreneurship',
            paymentVerified: true,
          }),
          env: FLAG_ENV,
        },
        {
          createServiceClient: () => admin,
          createUserClient: () => admin,
        },
      ),
    );
    expect(raised.status).toBe(403);
    expect(raised.body).toEqual(versaHttpDenyBody());
    const digest = await digestCode(HMAC, SYNTHETIC_CODES.free);
    const row = admin.tables.versa_code_inventory.find((item) => item.code_digest === digest);
    expect(row.status).toBe('available');
    expect(row.verified_user_id).toBeFalsy();
    expect(admin.tables.versa_entitlements).toHaveLength(0);
  });

  it('HTTP body paymentVerified has no effect; imported PRO still grants L2', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const withBodyTrue = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: SYNTHETIC_CODES.pro,
            intendedLevel: 'L2',
            intendedCourse: 'spike-interns',
            offeringId: 'financial-entrepreneurship',
            paymentVerified: true,
          }),
          env: FLAG_ENV,
        },
        {
          createServiceClient: () => admin,
          createUserClient: () => admin,
        },
      ),
    );
    expect(withBodyTrue.status).toBe(200);
    expect(withBodyTrue.body.ok).toBe(true);
    expect(admin.tables.versa_entitlements.map((row) => row.offering_id)).toEqual([
      'financial-entrepreneurship',
    ]);

    const killSwitchAdmin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: '2026-01-01T00:00:00.000Z' },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin: killSwitchAdmin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const bodyCannotOverrideOff = await readJson(
      await handleVersaRedeem(
        {
          request: postJson('https://portal.test/api/versa/redeem', {
            code: SYNTHETIC_CODES.pro,
            intendedLevel: 'L2',
            intendedCourse: 'spike-interns',
            offeringId: 'financial-entrepreneurship',
            paymentVerified: true,
            VERSA_PRO_CODE_IMPLIES_PAID: '1',
          }),
          env: { ...FLAG_ENV, VERSA_PRO_CODE_IMPLIES_PAID: '0' },
        },
        {
          createServiceClient: () => killSwitchAdmin,
          createUserClient: () => killSwitchAdmin,
        },
      ),
    );
    expect(bodyCannotOverrideOff.status).toBe(403);
    expect(bodyCannotOverrideOff.body).toEqual(versaHttpDenyBody());
    expect(bodyCannotOverrideOff.body.message).toBe(GENERIC_DENY_MESSAGE);
    expect(killSwitchAdmin.tables.versa_entitlements).toHaveLength(0);
  });

  it('PRO does not grant free-only offerings or RA-SPIKE', async () => {
    const admin = createMemoryAdmin();
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-pro.csv')).toString('utf8'),
    });
    const asLiteracy = await redeem(SYNTHETIC_CODES.pro, identity(), 'spike-interns', 'L1', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-literacy',
    });
    expect(asLiteracy.ok).toBe(false);
    expect(asLiteracy.reason).toBe(REASONS.wrong_offering);

    const asRa = await redeem(SYNTHETIC_CODES.pro2, identity(), 'ra-spike', 'L2', {
      env: FLAG_ENV,
      admin,
      offeringId: 'financial-entrepreneurship',
    });
    expect(asRa.ok).toBe(false);
    expect(asRa.reason).toBe(REASONS.wrong_program_route);
    expect(admin.tables.versa_entitlements).toHaveLength(0);
  });

  it('unverified sessions cannot claim a code', async () => {
    const admin = createMemoryAdmin({
      authUser: { id: LEARNER_ID, email: LEARNER, email_confirmed_at: null },
    });
    await importVersaCsv({
      env: FLAG_ENV,
      admin,
      csvText: (await loadFixture('versa-free.csv')).toString('utf8'),
    });
    const typed = await verify(
      SYNTHETIC_CODES.free,
      { userId: LEARNER_ID, email: LEARNER, emailConfirmed: false },
      'spike-interns',
      'L1',
      { env: FLAG_ENV, admin },
    );
    expect(typed.ok).toBe(false);
    expect(typed.reason).toBe(REASONS.unverified_identity);
    const stillAvailable = admin.tables.versa_code_inventory.find((row) => row.plan_slug === 'free' && row.status === 'available');
    expect(stillAvailable).toBeTruthy();
  });
});
