import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import {
  getActivationDateKey,
  validateInternActivationCode,
} from '../../functions/_shared/activationCode.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INTERN_ID = '00000000-0000-4000-8000-0000000000aa';
const STAFF_ID = '00000000-0000-4000-8000-0000000000bb';
const GHOST_ID = '00000000-0000-4000-8000-0000000000cc';
const SYNTHETIC_CODE = 'SPIKE1';

const MIGRATION_27 = readFileSync(
  join(ROOT, 'supabase/migrations/20260827_restrict_activation_codes_anon_read.sql'),
  'utf8',
);
const MIGRATION_29 = readFileSync(
  join(ROOT, 'supabase/migrations/20260829_gate_ensure_daily_activation_code.sql'),
  'utf8',
);
const SAFE_PARTIAL = readFileSync(
  join(ROOT, 'supabase/rollbacks/sec1_f1_safe_partial.sql'),
  'utf8',
);
const EXACT_RESTORE = readFileSync(
  join(ROOT, 'supabase/rollbacks/sec1_f1_exact_restore.sql'),
  'utf8',
);

/**
 * Mirrors functions/api/auth/intern-signup.js: service-role validation only.
 * Does not create auth users.
 */
async function internSignupValidateCode(admin, code) {
  const trimmed = String(code ?? '').trim();
  if (!trimmed) return { status: 400, message: 'Daily activation code is required.' };
  try {
    await validateInternActivationCode(admin, trimmed);
    return { status: 200, ok: true };
  } catch (err) {
    return { status: 400, message: err instanceof Error ? err.message : 'Signup failed.' };
  }
}

/** Minimal supabase-js surface used by validateInternActivationCode. */
function serviceRoleAdmin(db) {
  return {
    from(table) {
      if (table !== 'activation_codes') {
        throw new Error(`unexpected table ${table}`);
      }
      const state = { dateKey: null };
      const api = {
        select() {
          return api;
        },
        eq(col, val) {
          if (col === 'date_key') state.dateKey = val;
          return api;
        },
        order() {
          return api;
        },
        limit() {
          return api;
        },
        async maybeSingle() {
          await db.exec('SET ROLE service_role');
          try {
            const r = await db.query(
              `select code, expires_at
                 from public.activation_codes
                where date_key = $1::date
                order by generated_at desc
                limit 1`,
              [state.dateKey],
            );
            return { data: r.rows[0] ?? null, error: null };
          } catch (err) {
            return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
          } finally {
            await db.exec('RESET ROLE');
          }
        },
      };
      return api;
    },
  };
}

async function expectDenied(fn) {
  await expect(fn()).rejects.toThrow(/permission denied|must be owner|not allowed|insufficient/i);
}

describe('SEC-1 / F1 activation_codes hardening (PGlite)', () => {
  /** @type {PGlite | null} */
  let db = null;

  afterEach(async () => {
    await db?.close();
    db = null;
  });

  /**
   * @param {{ seedCode?: boolean, applyMigrations?: boolean }} [opts]
   */
  async function boot(opts = {}) {
    const { seedCode = true, applyMigrations = true } = opts;
    const todayKey = getActivationDateKey();
    db = new PGlite();

    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;

      grant usage on schema public to anon, authenticated, service_role;
      grant create on schema public to service_role;

      create schema if not exists auth;
      create or replace function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;

      create type public.app_role as enum ('INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER');

      create table public.profiles (
        id uuid primary key,
        email text not null unique,
        name text not null,
        role public.app_role not null default 'INTERN',
        read_only boolean not null default false
      );

      create or replace function public.current_role()
      returns public.app_role
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select role from public.profiles where id = auth.uid();
      $$;

      -- Live 20260718 portal_can_write().
      create or replace function public.portal_can_write()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select case
          when auth.uid() is null then false
          when public.current_role() = 'SUPERUSER' then true
          when public.current_role() = 'ADMIN' then coalesce(
            (select not p.read_only from public.profiles p where p.id = auth.uid()),
            true
          )
          else true
        end;
      $$;

      create or replace function public.manila_today()
      returns date
      language sql
      stable
      as $$
        select '${todayKey}'::date;
      $$;

      create or replace function public.manila_end_of_day(target date default public.manila_today())
      returns timestamptz
      language sql
      stable
      as $$
        select ((target + interval '1 day' - interval '1 second') at time zone 'Asia/Manila');
      $$;

      create or replace function public.random_activation_code()
      returns text
      language sql
      volatile
      as $$
        select upper(substr(md5(random()::text), 1, 6));
      $$;

      create table public.activation_codes (
        id bigint generated always as identity primary key,
        date_key date not null unique,
        code text not null,
        expires_at timestamptz not null,
        generated_by uuid references public.profiles(id) on delete set null,
        generated_at timestamptz not null default now()
      );

      alter table public.activation_codes enable row level security;
      alter table public.activation_codes force row level security;

      create or replace function public.ensure_daily_activation_code()
      returns public.activation_codes
      language plpgsql
      security definer
      set search_path = public
      as $$
      declare
        today date := public.manila_today();
        row public.activation_codes;
      begin
        insert into public.activation_codes (date_key, code, expires_at, generated_by)
        values (
          today,
          public.random_activation_code(),
          public.manila_end_of_day(today),
          auth.uid()
        )
        on conflict (date_key) do nothing;
        select * into row from public.activation_codes where date_key = today;
        return row;
      end;
      $$;

      -- Live ADMIN-gated regenerate() body (20260718), including fail-open NOT IN.
      create or replace function public.regenerate_daily_activation_code()
      returns public.activation_codes
      language plpgsql
      security definer
      set search_path = public
      as $$
      declare
        today date := public.manila_today();
        row public.activation_codes;
      begin
        if public.current_role() not in ('ADMIN', 'SUPERUSER') then
          raise exception 'Only administrators can regenerate activation codes';
        end if;
        if not public.portal_can_write() then
          raise exception 'View-only administrator — cannot regenerate activation codes';
        end if;
        insert into public.activation_codes (date_key, code, expires_at, generated_by)
        values (
          today,
          public.random_activation_code(),
          public.manila_end_of_day(today),
          auth.uid()
        )
        on conflict (date_key) do update
          set code = excluded.code,
              expires_at = excluded.expires_at,
              generated_by = excluded.generated_by,
              generated_at = now();
        select * into row from public.activation_codes where date_key = today;
        return row;
      end;
      $$;

      -- pg_cron stub so 20260829 can reschedule the live job.
      create schema if not exists cron;
      create table cron.job (
        jobid bigint generated always as identity primary key,
        jobname text unique not null,
        schedule text,
        command text
      );
      create or replace function cron.unschedule(job_name text)
      returns boolean
      language plpgsql
      as $$
      begin
        delete from cron.job where jobname = job_name;
        return true;
      end;
      $$;
      create or replace function cron.schedule(job_name text, schedule text, command text)
      returns bigint
      language plpgsql
      as $$
      declare
        id bigint;
      begin
        insert into cron.job (jobname, schedule, command)
        values (job_name, schedule, command)
        on conflict (jobname) do update
          set schedule = excluded.schedule,
              command = excluded.command
        returning jobid into id;
        return id;
      end;
      $$;
      insert into cron.job (jobname, schedule, command)
      values (
        'spike-daily-activation-code',
        '0 16 * * *',
        'select public.ensure_daily_activation_code();'
      );

      -- Live grants (read-only check, 11 Nov 2026): PUBLIC execute revoked by
      -- 20260614, then anon still held EXECUTE on ensure + regenerate, and ALL
      -- table privileges including TRUNCATE. public_read policy is live.
      grant all on table public.activation_codes to anon, authenticated, service_role;
      grant all on all sequences in schema public to anon, authenticated, service_role;
      revoke all on function public.ensure_daily_activation_code() from public;
      revoke all on function public.regenerate_daily_activation_code() from public;
      grant execute on function public.ensure_daily_activation_code() to anon, authenticated, service_role;
      grant execute on function public.regenerate_daily_activation_code() to anon, authenticated;
      grant execute on function public.current_role() to anon, authenticated, service_role;
      grant execute on function public.portal_can_write() to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      grant execute on function public.manila_today() to anon, authenticated, service_role;
      grant execute on function public.manila_end_of_day(date) to anon, authenticated, service_role;
      grant execute on function public.random_activation_code() to anon, authenticated, service_role;
      grant select on table public.profiles to authenticated, service_role;

      create policy "activation_codes_public_read"
      on public.activation_codes
      for select
      to anon, authenticated
      using (expires_at > now());

      insert into public.profiles (id, email, name, role) values
        ('${INTERN_ID}', 'intern.synthetic@example.test', 'Synthetic Intern', 'INTERN'),
        ('${STAFF_ID}', 'faculty.synthetic@example.test', 'Synthetic Faculty', 'FACULTY');
    `);

    if (applyMigrations) {
      await db.exec(MIGRATION_27);
      await db.exec(MIGRATION_29);
    }

    if (seedCode) {
      await db.exec(`
        insert into public.activation_codes (date_key, code, expires_at, generated_by)
        values (
          '${todayKey}'::date,
          '${SYNTHETIC_CODE}',
          public.manila_end_of_day('${todayKey}'::date),
          '${STAFF_ID}'
        )
        on conflict (date_key) do update
          set code = excluded.code,
              expires_at = excluded.expires_at,
              generated_by = excluded.generated_by;
      `);
    }

    return todayKey;
  }

  async function asAuthenticated(userId, extraClaims = {}) {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId]);
    if (extraClaims.role) {
      await db.query(`select set_config('request.jwt.claim.role', $1, false)`, [extraClaims.role]);
    }
    await db.exec('SET ROLE authenticated');
  }

  it('SET ROLE anon: SELECT, EXECUTE ensure_daily_activation_code, and TRUNCATE all fail', async () => {
    await boot();

    await db.exec('SET ROLE anon');
    try {
      await expectDenied(() => db.exec('select * from public.activation_codes'));
      await expectDenied(() => db.exec('select public.ensure_daily_activation_code()'));
      await expectDenied(() => db.exec('truncate public.activation_codes'));
      await expectDenied(() => db.exec('select public.regenerate_daily_activation_code()'));
      await expectDenied(() => db.exec('select public.mint_daily_activation_code()'));
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('authenticated INTERN gets no code back from ensure_daily_activation_code()', async () => {
    await boot();
    await asAuthenticated(INTERN_ID);
    try {
      await expect(db.exec('select public.ensure_daily_activation_code()')).rejects.toThrow(
        /Only staff can load daily activation codes/i,
      );
    } finally {
      await db.exec('RESET ROLE');
    }

    const stillThere = await db.query(
      `select code from public.activation_codes where date_key = public.manila_today()`,
    );
    expect(stillThere.rows[0].code).toBe(SYNTHETIC_CODE);
  });

  it('authenticated INTERN table SELECT returns 0 rows', async () => {
    await boot();
    await asAuthenticated(INTERN_ID);
    try {
      const table = await db.query('select code from public.activation_codes');
      expect(table.rows).toHaveLength(0);
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('forged JWT ADMIN with an intern profile is denied by ensure()', async () => {
    await boot();
    await asAuthenticated(INTERN_ID, { role: 'ADMIN' });
    try {
      await expect(db.exec('select public.ensure_daily_activation_code()')).rejects.toThrow(
        /Only staff can load daily activation codes/i,
      );
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('null-profile role is denied by ensure()', async () => {
    await boot();
    await asAuthenticated(GHOST_ID);
    try {
      await expect(db.exec('select public.ensure_daily_activation_code()')).rejects.toThrow(
        /Only staff can load daily activation codes/i,
      );
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('staff can read today\'s code via the function and the staff-read policy', async () => {
    await boot();
    await asAuthenticated(STAFF_ID);
    try {
      const rpc = await db.query('select code from public.ensure_daily_activation_code()');
      expect(rpc.rows[0].code).toBe(SYNTHETIC_CODE);

      const table = await db.query(
        `select code from public.activation_codes where date_key = public.manila_today()`,
      );
      expect(table.rows[0].code).toBe(SYNTHETIC_CODE);
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('intern-signup.js service-role validation accepts a valid synthetic code and rejects an invalid one', async () => {
    await boot();
    const admin = serviceRoleAdmin(db);

    const valid = await internSignupValidateCode(admin, SYNTHETIC_CODE);
    expect(valid).toEqual({ status: 200, ok: true });

    const invalid = await internSignupValidateCode(admin, 'NOPE99');
    expect(invalid.status).toBe(400);
    expect(invalid.message).toBe('Invalid activation code.');
  });

  it('expired signup code is rejected', async () => {
    await boot();
    await db.exec(`
      update public.activation_codes
         set expires_at = now() - interval '1 hour'
       where date_key = public.manila_today()
    `);
    const expired = await internSignupValidateCode(serviceRoleAdmin(db), SYNTHETIC_CODE);
    expect(expired.status).toBe(400);
    expect(expired.message).toMatch(/expired/i);
  });

  it('applying F1 migrations twice is idempotent', async () => {
    await boot();
    await db.exec(MIGRATION_27);
    await db.exec(MIGRATION_29);
    await asAuthenticated(STAFF_ID);
    try {
      const rpc = await db.query('select code from public.ensure_daily_activation_code()');
      expect(rpc.rows[0].code).toBe(SYNTHETIC_CODE);
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('cron mint works with a null auth.uid() and intern signup validates the minted row', async () => {
    await boot({ seedCode: false });

    const job = await db.query(
      `select command from cron.job where jobname = 'spike-daily-activation-code'`,
    );
    expect(job.rows[0].command).toMatch(/mint_daily_activation_code/);
    expect(job.rows[0].command).not.toMatch(/ensure_daily_activation_code/);

    await db.exec(`select set_config('request.jwt.claim.sub', '', false)`);
    await db.exec('select public.mint_daily_activation_code()');

    const minted = await db.query(
      `select code from public.activation_codes where date_key = public.manila_today()`,
    );
    expect(minted.rows).toHaveLength(1);
    const code = minted.rows[0].code;
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    const valid = await internSignupValidateCode(serviceRoleAdmin(db), code);
    expect(valid).toEqual({ status: 200, ok: true });

    await asAuthenticated(STAFF_ID);
    try {
      await expectDenied(() => db.exec('select public.mint_daily_activation_code()'));
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('regenerate() with a null role is denied', async () => {
    await boot();
    await asAuthenticated(GHOST_ID);
    try {
      await expect(db.exec('select public.regenerate_daily_activation_code()')).rejects.toThrow(
        /Only administrators can regenerate activation codes/i,
      );
    } finally {
      await db.exec('RESET ROLE');
    }
    const stillThere = await db.query(
      `select code from public.activation_codes where date_key = public.manila_today()`,
    );
    expect(stillThere.rows[0].code).toBe(SYNTHETIC_CODE);
  });

  it('safe-partial rollback drops mint, restores public-read, and points cron at ensure()', async () => {
    await boot();
    await db.exec(SAFE_PARTIAL);

    const mintGone = await db.query(
      `select to_regprocedure('public.mint_daily_activation_code()') is null as gone`,
    );
    expect(mintGone.rows[0].gone).toBe(true);

    const job = await db.query(
      `select command from cron.job where jobname = 'spike-daily-activation-code'`,
    );
    expect(job.rows[0].command).toMatch(/ensure_daily_activation_code/);
    expect(job.rows[0].command).not.toMatch(/mint_daily_activation_code/);

    const policy = await db.query(`
      select polname from pg_policy
      where polrelid = 'public.activation_codes'::regclass
        and polname = 'activation_codes_public_read'
    `);
    expect(policy.rows).toHaveLength(1);

    await db.exec('SET ROLE anon');
    try {
      await expectDenied(() => db.exec('truncate public.activation_codes'));
    } finally {
      await db.exec('RESET ROLE');
    }
  });

  it('exact-restore rollback re-grants live anon table ALL and ensure EXECUTE', async () => {
    await boot();
    await db.exec(EXACT_RESTORE);

    const mintGone = await db.query(
      `select to_regprocedure('public.mint_daily_activation_code()') is null as gone`,
    );
    expect(mintGone.rows[0].gone).toBe(true);

    const job = await db.query(
      `select command from cron.job where jobname = 'spike-daily-activation-code'`,
    );
    expect(job.rows[0].command).toMatch(/ensure_daily_activation_code/);

    const privs = await db.query(`
      select
        has_table_privilege('anon', 'public.activation_codes', 'TRUNCATE') as anon_truncate,
        has_function_privilege('anon', 'public.ensure_daily_activation_code()', 'EXECUTE') as anon_ensure
    `);
    expect(privs.rows[0].anon_truncate).toBe(true);
    expect(privs.rows[0].anon_ensure).toBe(true);
  });
});
