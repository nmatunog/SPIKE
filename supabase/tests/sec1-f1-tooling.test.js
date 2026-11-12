import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleInternSignup } from '../../functions/api/auth/intern-signup.js';
import {
  INTERN_SIGNUP_RATE_LIMITED_MESSAGE,
  INTERN_SIGNUP_RATE_MAX_DEFAULT,
} from '../../functions/_shared/internSignupRateLimit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function postSignup(code = 'SPIKE1') {
  return new Request('https://portal.test/api/auth/intern-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.9',
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
  todayCode = 'SPIKE1',
  store = { count: 0 },
  max = INTERN_SIGNUP_RATE_MAX_DEFAULT,
} = {}) {
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
    rpc: async (name) => {
      if (missingLimiter) {
        return {
          data: null,
          error: { code: 'PGRST202', message: 'Could not find the function' },
        };
      }
      if (name === 'intern_signup_rate_limit_begin_attempt') {
        if (store.count >= max) {
          return { data: { allowed: false, fail_count: store.count }, error: null };
        }
        store.count += 1;
        return { data: { allowed: true, fail_count: store.count }, error: null };
      }
      if (name === 'intern_signup_rate_limit_refund_success') {
        store.count = Math.max(store.count - 1, 0);
        return { data: store.count, error: null };
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

  it('counts only failed code attempts and uses the classroom cap of 20', async () => {
    expect(INTERN_SIGNUP_RATE_MAX_DEFAULT).toBe(20);
    const store = { count: 0 };
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
    const store = { count: 0 };
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
});
