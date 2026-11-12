import { afterEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const USER_A = '00000000-0000-4000-8000-00000000000a';
const USER_B = '00000000-0000-4000-8000-00000000000b';

const SCHEMA_SQL = `
create table if not exists versa_code_inventory (
  id bigint generated always as identity primary key,
  code_digest text not null unique,
  versa_lead_ref text not null,
  verified_email text,
  verified_user_id uuid,
  level text not null check (level in ('L1', 'L2')),
  offering_id text not null,
  status text not null default 'available' check (status in ('available', 'redeemed', 'revoked', 'expired')),
  program_route text not null default 'spike-interns' check (program_route in ('spike-interns', 'ra-spike')),
  plan_slug text,
  redeemed_at timestamptz,
  redeemed_by uuid
);

create table if not exists versa_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  inventory_id bigint not null references versa_code_inventory(id),
  versa_lead_ref text not null,
  level text not null,
  offering_id text not null,
  program_route text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, offering_id)
);

create table if not exists versa_rate_limits (
  rate_key text primary key,
  fail_count integer not null default 0,
  window_start timestamptz not null default now()
);

create or replace function redeem_versa_code_and_grant(
  p_id bigint,
  p_user_id uuid,
  p_period_days integer default 30,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
as $$
declare
  inv versa_code_inventory;
  ent versa_entitlements;
  period_days integer := greatest(coalesce(p_period_days, 30), 0);
  at timestamptz := coalesce(p_now, now());
begin
  select * into inv from versa_code_inventory where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;

  if inv.status = 'redeemed' and coalesce(inv.plan_slug, '') = 'pro' then
    return jsonb_build_object('ok', false, 'reason', 'reused');
  end if;

  if inv.status = 'redeemed' and inv.redeemed_by = p_user_id then
    insert into versa_entitlements (
      user_id, inventory_id, versa_lead_ref, level, offering_id, program_route, expires_at
    ) values (
      p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route, null
    )
    on conflict (user_id, offering_id) do update
      set inventory_id = excluded.inventory_id
    returning * into ent;

    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'row', to_jsonb(inv),
      'entitlement', to_jsonb(ent)
    );
  end if;

  update versa_code_inventory
     set status = 'redeemed',
         redeemed_at = at,
         redeemed_by = p_user_id,
         verified_user_id = coalesce(verified_user_id, p_user_id)
   where id = p_id
     and status = 'available'
  returning * into inv;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reused');
  end if;

  insert into versa_entitlements (
    user_id, inventory_id, versa_lead_ref, level, offering_id, program_route, expires_at
  ) values (
    p_user_id,
    inv.id,
    inv.versa_lead_ref,
    inv.level,
    inv.offering_id,
    inv.program_route,
    case
      when coalesce(inv.plan_slug, '') = 'pro'
        then at + make_interval(days => period_days)
      else null
    end
  )
  on conflict (user_id, offering_id) do update
    set inventory_id = excluded.inventory_id,
        versa_lead_ref = excluded.versa_lead_ref,
        expires_at = case
          when coalesce(inv.plan_slug, '') = 'pro' then
            greatest(at, coalesce(versa_entitlements.expires_at, at))
              + make_interval(days => period_days)
          else versa_entitlements.expires_at
        end
  returning * into ent;

  return jsonb_build_object(
    'ok', true,
    'already_granted', false,
    'row', to_jsonb(inv),
    'entitlement', to_jsonb(ent)
  );
end;
$$;

create or replace function versa_rate_limit_record_fail(p_rate_key text, p_window_ms integer)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  insert into versa_rate_limits (rate_key, fail_count, window_start)
  values (p_rate_key, 1, now())
  on conflict (rate_key) do update
    set fail_count = versa_rate_limits.fail_count + 1
  returning fail_count into new_count;
  return new_count;
end;
$$;
`;

describe('Versa redeem_versa_code_and_grant (PGlite)', () => {
  /** @type {PGlite | null} */
  let db = null;

  afterEach(async () => {
    await db?.close();
    db = null;
  });

  async function boot() {
    db = new PGlite();
    await db.exec(SCHEMA_SQL);
    const inserted = await db.query(
      `insert into versa_code_inventory
        (code_digest, versa_lead_ref, verified_email, level, offering_id, status, program_route)
       values ('digest-once', 'lead-once', 'learner.valid@example.test', 'L1', 'financial-literacy', 'available', 'spike-interns')
       returning id`,
    );
    return Number(inserted.rows[0].id);
  }

  it('single-use: concurrent-style calls consume the row once', async () => {
    const id = await boot();
    const [first, second] = await Promise.all([
      db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_A]),
      db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_B]),
    ]);
    const outcomes = [first.rows[0].result, second.rows[0].result];
    const wins = outcomes.filter((row) => row.ok === true && row.already_granted === false);
    const reused = outcomes.filter((row) => row.ok === false && row.reason === 'reused');
    expect(wins).toHaveLength(1);
    expect(reused).toHaveLength(1);

    const inventory = await db.query(
      'select status, redeemed_by, verified_user_id from versa_code_inventory where id = $1',
      [id],
    );
    expect(inventory.rows[0].status).toBe('redeemed');
    const redeemedBy = inventory.rows[0].redeemed_by;
    expect([USER_A, USER_B]).toContain(redeemedBy);
    expect(inventory.rows[0].verified_user_id).toBe(redeemedBy);

    const entitlements = await db.query('select user_id from versa_entitlements');
    expect(entitlements.rows).toHaveLength(1);
    expect(entitlements.rows[0].user_id).toBe(redeemedBy);
  });

  it('recoverable grant: same learner retry recreates a missing entitlement without burning a second code', async () => {
    const id = await boot();
    const first = await db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_A]);
    expect(first.rows[0].result.ok).toBe(true);
    expect(first.rows[0].result.already_granted).toBe(false);

    await db.exec('delete from versa_entitlements;');

    const retry = await db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_A]);
    expect(retry.rows[0].result.ok).toBe(true);
    expect(retry.rows[0].result.already_granted).toBe(true);

    const entitlements = await db.query('select user_id, offering_id, expires_at from versa_entitlements');
    expect(entitlements.rows).toHaveLength(1);
    expect(entitlements.rows[0].expires_at).toBeNull();

    const other = await db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_B]);
    expect(other.rows[0].result).toMatchObject({ ok: false, reason: 'reused' });
  });

  it('PRO already-granted recreate never runs; a consumed code stays reused', async () => {
    db = new PGlite();
    await db.exec(SCHEMA_SQL);
    const inserted = await db.query(
      `insert into versa_code_inventory
        (code_digest, versa_lead_ref, verified_email, level, offering_id, status, program_route, plan_slug)
       values ('digest-pro-recreate', 'lead-pro', 'learner.valid@example.test', 'L2', 'financial-entrepreneurship', 'available', 'spike-interns', 'pro')
       returning id`,
    );
    const id = Number(inserted.rows[0].id);
    const t0 = '2026-02-01T00:00:00.000Z';
    const first = await db.query(
      'select redeem_versa_code_and_grant($1, $2, 30, $3::timestamptz) as result',
      [id, USER_A, t0],
    );
    expect(first.rows[0].result.ok).toBe(true);
    expect(first.rows[0].result.entitlement.expires_at).toBeTruthy();

    await db.exec('delete from versa_entitlements;');

    const retry = await db.query(
      'select redeem_versa_code_and_grant($1, $2, 30, $3::timestamptz) as result',
      [id, USER_A, t0],
    );
    expect(retry.rows[0].result).toMatchObject({ ok: false, reason: 'reused' });
    const rows = await db.query('select expires_at from versa_entitlements');
    expect(rows.rows).toHaveLength(0);
  });

  it('concurrent PRO codes stack 30+30 from the live row', async () => {
    db = new PGlite();
    await db.exec(SCHEMA_SQL);
    const inserted = await db.query(
      `insert into versa_code_inventory
        (code_digest, versa_lead_ref, verified_email, level, offering_id, status, program_route, plan_slug)
       values
         ('digest-pro-a', 'lead-pro-a', 'learner.valid@example.test', 'L2', 'financial-entrepreneurship', 'available', 'spike-interns', 'pro'),
         ('digest-pro-b', 'lead-pro-b', 'learner.valid@example.test', 'L2', 'financial-entrepreneurship', 'available', 'spike-interns', 'pro')
       returning id`,
    );
    const idA = Number(inserted.rows[0].id);
    const idB = Number(inserted.rows[1].id);
    const t0 = '2026-02-01T00:00:00.000Z';
    const [first, second] = await Promise.all([
      db.query('select redeem_versa_code_and_grant($1, $2, 30, $3::timestamptz) as result', [idA, USER_A, t0]),
      db.query('select redeem_versa_code_and_grant($1, $2, 30, $3::timestamptz) as result', [idB, USER_A, t0]),
    ]);
    const outcomes = [first.rows[0].result, second.rows[0].result];
    expect(outcomes.every((row) => row.ok === true && row.already_granted === false)).toBe(true);
    const ent = await db.query(
      'select expires_at from versa_entitlements where user_id = $1 and offering_id = $2',
      [USER_A, 'financial-entrepreneurship'],
    );
    expect(ent.rows).toHaveLength(1);
    expect(ent.rows[0].expires_at).not.toBeNull();
    expect(new Date(ent.rows[0].expires_at).toISOString()).toBe('2026-04-02T00:00:00.000Z');
  });

  it('rate limit increment is atomic (fail_count = fail_count + 1)', async () => {
    await boot();
    const [a, b] = await Promise.all([
      db.query('select versa_rate_limit_record_fail($1, $2) as n', ['ip:test', 600000]),
      db.query('select versa_rate_limit_record_fail($1, $2) as n', ['ip:test', 600000]),
    ]);
    const counts = [Number(a.rows[0].n), Number(b.rows[0].n)].sort((x, y) => x - y);
    expect(counts).toEqual([1, 2]);
    const row = await db.query('select fail_count from versa_rate_limits where rate_key = $1', ['ip:test']);
    expect(Number(row.rows[0].fail_count)).toBe(2);
  });
});
