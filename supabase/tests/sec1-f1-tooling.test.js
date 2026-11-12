import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleInternSignup } from '../../functions/api/auth/intern-signup.js';
import {
  INTERN_SIGNUP_GLOBAL_CEILING_ALERT,
  INTERN_SIGNUP_GLOBAL_MAX_DEFAULT,
  INTERN_SIGNUP_RATE_LIMITED_MESSAGE,
  INTERN_SIGNUP_RATE_MAX_DEFAULT,
  INTERN_SIGNUP_UNAVAILABLE_MESSAGE,
  beginInternSignupAttempt,
  internSignupGlobalRateKey,
  internSignupRateKey,
  parseBeginResult,
} from '../../functions/_shared/internSignupRateLimit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function postSignup(code = 'SPIKE1', ip = '203.0.113.9') {
  return new Request('https://portal.test/api/auth/intern-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
    },
    body: JSON.stringify({
      name: 'Test Intern',
      email: 'intern.valid@example.test',
      password: 'password12',
      code,
    }),
  });
}

describe('SEC-1 tooling', () => {
  it('ship-after-build migrations are opt-in after the main-branch check', () => {
    const out = execFileSync('bash', [join(ROOT, 'scripts/check-ship-migrations-opt-in.sh')], {
      encoding: 'utf8',
    });
    expect(out).toMatch(/OK/);
    const ship = readFileSync(join(ROOT, 'scripts/ship-after-build.sh'), 'utf8');
    const mainIdx = ship.search(/BRANCH"\s*!=\s*"main"/);
    const migIdx = ship.search(/run-supabase-migrations\.sh/);
    expect(mainIdx).toBeGreaterThan(0);
    expect(migIdx).toBeGreaterThan(mainIdx);
    expect(ship).toMatch(/APPLY_DB_MIGRATIONS:-/);
    expect(ship).not.toMatch(/continuing ship/);
    expect(ship).toMatch(/aborting ship/);
  });

  it('SEC-1 post-apply probe checks grants and policies, not schema_migrations', () => {
    const sql = readFileSync(join(ROOT, 'scripts/probe-sec1-f1-grants.sql'), 'utf8');
    expect(sql).toMatch(/has_table_privilege\('anon', 'public\.activation_codes', 'SELECT'\)/);
    expect(sql).toMatch(/has_function_privilege/);
    expect(sql).toMatch(/ensure_daily_activation_code\(\)/);
    expect(sql).toMatch(/regenerate_daily_activation_code\(\)/);
    expect(sql).toMatch(/activation_codes_public_read/);
    expect(sql).not.toMatch(/schema_migrations/);
    const printed = execFileSync('bash', [join(ROOT, 'scripts/probe-sec1-f1-grants.sh')], {
      encoding: 'utf8',
    });
    expect(printed).toMatch(/SQL-only/);
    expect(printed).toMatch(/has_table_privilege/);
  });

  it('pending-set: full SEC-1 then Versa applies; 20261114090001 then Versa fails loudly', () => {
    const out = execFileSync('bash', [join(ROOT, 'scripts/check-pending-migrations-sec1.sh')], {
      encoding: 'utf8',
    });
    expect(out).toMatch(/OK/);
    expect(out).toMatch(/full SEC-1 then Versa applies/);
    expect(out).toMatch(/20261114090001 then Versa fails loudly/);
  });

  it('RA-SPIKE sync check asserts 20261112070001 by name and docs cover live-apply', () => {
    const sync = readFileSync(join(ROOT, 'scripts/check-sec1-f1-ra-spike-sync.sh'), 'utf8');
    expect(sync).toMatch(/F1_ATOMIC="20261112070001_intern_signup_rate_limit_atomic\.sql"/);
    const docs = readFileSync(join(ROOT, 'docs/sec1-f1-activation-codes.md'), 'utf8');
    expect(docs).toMatch(/SKIP_APPLY=1/);
    expect(docs).toMatch(/ALLOW_OUT_OF_ORDER=1[`']? on live/);
    expect(docs).toMatch(/SEC-1 \(#14[\s\S]*before Versa \(#13\)/);
    expect(docs).toMatch(/INTERN_SIGNUP_GLOBAL_MAX_DEFAULT/);
    expect(docs).toMatch(/\/64/);
    expect(docs).toMatch(/wrapper sets `EXPECTED_PROJECT_REF`/);
    expect(docs).toMatch(/10 distinct IPs/);
    expect(docs).toMatch(/delete from public\.intern_signup_rate_limits/);
    expect(docs).toMatch(/ip:unknown/);
  });

  it('rollback SQL lives only under supabase/rollbacks/', () => {
    const src = execFileSync(
      'bash',
      ['-lc', `ls "${ROOT}/supabase/migrations" | grep -E '_rollback_|rollback' || true`],
      { encoding: 'utf8' },
    );
    expect(src.trim()).toBe('');
  });
});

function signupAdmin({
  missingLimiter = false,
  rpcError = null,
  todayCode = 'SPIKE1',
  store = {},
  max = INTERN_SIGNUP_RATE_MAX_DEFAULT,
} = {}) {
  if (!store.byKey) store.byKey = {};
  delete store.count;
  Object.defineProperty(store, 'count', {
    configurable: true,
    enumerable: true,
    get() {
      return Object.entries(store.byKey)
        .filter(([key]) => key.startsWith('ip:'))
        .reduce((n, [, v]) => n + v, 0);
    },
  });
  const chain = (table) => {
    const api = {
      select() {
        return api;
      },
      eq() {
        return api;
      },
      order() {
        return api;
      },
      limit() {
        return api;
      },
      maybeSingle: async () => {
        if (table === 'activation_codes') {
          return {
            data: {
              code: todayCode,
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
      upsert: async () => ({ error: null }),
    };
    return api;
  };

  return {
    store,
    from(table) {
      return chain(table);
    },
    rpc: async (name, args = {}) => {
      if (rpcError) {
        return { data: null, error: rpcError };
      }
      if (missingLimiter) {
        return {
          data: null,
          error: { code: 'PGRST202', message: 'Could not find the function' },
        };
      }
      if (name === 'intern_signup_rate_limit_begin_attempt') {
        const key = String(args.p_rate_key || '');
        const capRaw = Number(args.p_max);
        const cap = Number.isFinite(capRaw) && capRaw > 0 ? capRaw : max;
        const current = store.byKey[key] || 0;
        if (current >= cap) {
          return { data: { allowed: false, fail_count: current }, error: null };
        }
        store.byKey[key] = current + 1;
        return { data: { allowed: true, fail_count: store.byKey[key] }, error: null };
      }
      if (name === 'intern_signup_rate_limit_refund_success') {
        const key = String(args.p_rate_key || '');
        store.byKey[key] = Math.max((store.byKey[key] || 0) - 1, 0);
        return { data: store.byKey[key], error: null };
      }
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    },
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        createUser: async () => ({ data: { user: { id: 'user-intern-1' } }, error: null }),
      },
    },
  };
}

describe('intern signup per-IP rate limit', () => {
  it('fails open when intern_signup_rate_limits / RPC is missing (does not 429)', async () => {
    const warnings = [];
    const original = console.error;
    console.error = (...args) => {
      warnings.push(args.map(String).join(' '));
    };
    try {
      const missing = signupAdmin({ missingLimiter: true });
      const legit = await handleInternSignup(
        { request: postSignup('SPIKE1'), env: {} },
        { createServiceClient: () => missing },
      );
      expect(legit.status).toBe(200);
      expect((await legit.json()).ok).toBe(true);
      expect(warnings.join('\n')).toMatch(/FAIL OPEN|UNAVAILABLE/i);

      const invalid = await handleInternSignup(
        { request: postSignup('NOPE99'), env: {} },
        { createServiceClient: () => signupAdmin({ missingLimiter: true }) },
      );
      expect(invalid.status).toBe(400);
      expect((await invalid.json()).message).toMatch(/Invalid activation code/i);
    } finally {
      console.error = original;
    }
  });

  it('fails closed with generic 503 on non-missing limiter rpc.error', async () => {
    const admin = signupAdmin({
      rpcError: { code: '57014', message: 'canceling statement due to statement timeout' },
    });
    const res = await handleInternSignup(
      { request: postSignup('SPIKE1'), env: {} },
      { createServiceClient: () => admin },
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.message).toBe(INTERN_SIGNUP_UNAVAILABLE_MESSAGE);
    expect(body.message).not.toMatch(/timeout/i);
  });

  it('counts only failed code attempts and uses the classroom cap of 20', async () => {
    expect(INTERN_SIGNUP_RATE_MAX_DEFAULT).toBe(20);
    const store = {};
    const admin = signupAdmin({ store, todayCode: 'SPIKE1' });

    const ok = await handleInternSignup(
      { request: postSignup('SPIKE1'), env: {} },
      { createServiceClient: () => admin },
    );
    expect(ok.status).toBe(200);
    expect(store.count).toBe(0);

    for (let i = 0; i < INTERN_SIGNUP_RATE_MAX_DEFAULT; i += 1) {
      const res = await handleInternSignup(
        { request: postSignup('NOPE99'), env: {} },
        { createServiceClient: () => admin },
      );
      expect(res.status).toBe(400);
    }
    expect(store.count).toBe(20);

    const locked = await handleInternSignup(
      { request: postSignup('SPIKE1'), env: {} },
      { createServiceClient: () => admin },
    );
    expect(locked.status).toBe(429);
    expect((await locked.json()).message).toBe(INTERN_SIGNUP_RATE_LIMITED_MESSAGE);
  });

  it('burst race: a single RPC check-and-increment admits only the cap', async () => {
    const store = {};
    const admin = signupAdmin({ store, todayCode: 'SPIKE1' });
    const results = await Promise.all(
      Array.from({ length: 25 }, () =>
        handleInternSignup(
          { request: postSignup('NOPE99'), env: {} },
          { createServiceClient: () => admin },
        ),
      ),
    );
    const statuses = await Promise.all(results.map(async (res) => res.status));
    expect(statuses.filter((s) => s === 400)).toHaveLength(20);
    expect(statuses.filter((s) => s === 429)).toHaveLength(5);
    expect(store.count).toBe(20);
  });

  it('keys IPv6 by /64 prefix and leaves IPv4 unchanged', () => {
    const headers = (ip) => ({
      headers: { get: (name) => (name === 'CF-Connecting-IP' ? ip : null) },
    });
    expect(internSignupRateKey(headers('192.0.2.9'))).toBe('ip:192.0.2.9');
    expect(internSignupRateKey(headers('::ffff:192.0.2.9'))).toBe('ip:192.0.2.9');
    expect(internSignupRateKey(headers('[::ffff:192.0.2.9]'))).toBe('ip:192.0.2.9');
    expect(internSignupRateKey(headers('::ffff:192.0.2.9%eth0'))).toBe('ip:192.0.2.9');
    expect(internSignupRateKey(headers('[::ffff:192.0.2.9%eth0]'))).toBe('ip:192.0.2.9');
    expect(internSignupRateKey(headers('2001:db8:1:2:3:4:5:6'))).toBe(
      'ip:2001:db8:1:2::/64',
    );
    expect(internSignupRateKey(headers('2001:db8:1:2:aaaa:bbbb:cccc:dddd'))).toBe(
      'ip:2001:db8:1:2::/64',
    );
    expect(internSignupRateKey(headers('2001:db8:1:3::1'))).toBe('ip:2001:db8:1:3::/64');
  });

  it('ignores X-Forwarded-For and shares ip:unknown when CF-Connecting-IP is missing', () => {
    const xffOnly = {
      headers: {
        get: (name) => (name === 'X-Forwarded-For' ? '198.51.100.7, 203.0.113.1' : null),
      },
    };
    expect(internSignupRateKey(xffOnly)).toBe('ip:unknown');
    expect(internSignupRateKey({ headers: { get: () => null } })).toBe('ip:unknown');
    expect(internSignupRateKey({ headers: { get: (name) => (name === 'CF-Connecting-IP' ? '   ' : null) } })).toBe(
      'ip:unknown',
    );
    const both = {
      headers: {
        get: (name) => {
          if (name === 'CF-Connecting-IP') return '192.0.2.9';
          if (name === 'X-Forwarded-For') return '198.51.100.7';
          return null;
        },
      },
    };
    expect(internSignupRateKey(both)).toBe('ip:192.0.2.9');
  });

  it('parseBeginResult requires allowed === true', () => {
    expect(parseBeginResult({ allowed: true, fail_count: 1 }).allowed).toBe(true);
    expect(parseBeginResult({ allowed: false, fail_count: 20 }).allowed).toBe(false);
    expect(parseBeginResult({ fail_count: 1 }).allowed).toBe(false);
    expect(parseBeginResult(null).allowed).toBe(false);
    expect(parseBeginResult('{"allowed":true,"fail_count":2}').allowed).toBe(true);
    expect(parseBeginResult('{"allowed":"true"}').allowed).toBe(false);
  });

  it('beginInternSignupAttempt denies when the RPC omits allowed', async () => {
    const admin = {
      rpc: async () => ({ data: { fail_count: 1 }, error: null }),
    };
    const gate = await beginInternSignupAttempt({ admin, key: 'ip:203.0.113.9' });
    expect(gate.ok).toBe(false);
    expect(gate.fail_count).toBe(1);
  });

  it('locks with a generic 429 and alert when the global code-day ceiling is hit', async () => {
    expect(INTERN_SIGNUP_GLOBAL_MAX_DEFAULT).toBe(200);
    expect(internSignupGlobalRateKey('2026-11-12')).toBe('global:2026-11-12');
    const store = {};
    const admin = signupAdmin({ store, todayCode: 'SPIKE1' });
    const alerts = [];
    const original = console.error;
    console.error = (...args) => {
      alerts.push(args.map(String).join(' '));
    };
    try {
      for (let i = 0; i < 3; i += 1) {
        const res = await handleInternSignup(
          {
            request: postSignup('NOPE99', `198.51.100.${i + 1}`),
            env: { INTERN_SIGNUP_GLOBAL_MAX: '3' },
          },
          { createServiceClient: () => admin },
        );
        expect(res.status).toBe(400);
      }
      const locked = await handleInternSignup(
        {
          request: postSignup('NOPE99', '198.51.100.99'),
          env: { INTERN_SIGNUP_GLOBAL_MAX: '3' },
        },
        { createServiceClient: () => admin },
      );
      expect(locked.status).toBe(429);
      expect((await locked.json()).message).toBe(INTERN_SIGNUP_RATE_LIMITED_MESSAGE);
      expect(alerts.join('\n')).toMatch(new RegExp(INTERN_SIGNUP_GLOBAL_CEILING_ALERT));
      expect(store.byKey['ip:198.51.100.99']).toBe(0);
    } finally {
      console.error = original;
    }
  });
});
