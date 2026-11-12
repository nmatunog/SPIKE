import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleInternSignup } from '../../functions/api/auth/intern-signup.js';
import { INTERN_SIGNUP_RATE_LIMITED_MESSAGE } from '../../functions/_shared/internSignupRateLimit.js';

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

describe('intern signup per-IP rate limit', () => {
  it('fails closed when intern_signup_rate_limits is missing', async () => {
    const admin = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({
            data: null,
            error: { code: '42P01', message: 'relation intern_signup_rate_limits does not exist' },
          }),
        };
      },
      rpc: async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function' },
      }),
    };
    const res = await handleInternSignup(
      { request: postSignup(), env: {} },
      { createServiceClient: () => admin },
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.message).toBe(INTERN_SIGNUP_RATE_LIMITED_MESSAGE);
  });

  it('returns 429 after the durable max failures', async () => {
    const admin = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({
            data: {
              rate_key: 'ip:203.0.113.9',
              fail_count: 8,
              window_start: new Date().toISOString(),
            },
            error: null,
          }),
        };
      },
      rpc: async () => ({ data: 9, error: null }),
    };
    const res = await handleInternSignup(
      { request: postSignup(), env: {} },
      { createServiceClient: () => admin },
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.message).toBe(INTERN_SIGNUP_RATE_LIMITED_MESSAGE);
  });
});
