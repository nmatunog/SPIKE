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
  next_expiry timestamptz;
begin
  select * into inv from versa_code_inventory where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;

  if inv.status = 'redeemed' and inv.redeemed_by = p_user_id then
    insert into versa_entitlements (
      user_id, inventory_id, versa_lead_ref, level, offering_id, program_route
    ) values (
      p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route
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

  if coalesce(inv.plan_slug, '') = 'pro' then
    select expires_at into next_expiry
      from versa_entitlements
     where user_id = p_user_id and offering_id = inv.offering_id;
    next_expiry := greatest(at, coalesce(next_expiry, at)) + make_interval(days => period_days);
  else
    next_expiry := null;
  end if;

  insert into versa_entitlements (
    user_id, inventory_id, versa_lead_ref, level, offering_id, program_route, expires_at
  ) values (
    p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route, next_expiry
  )
  on conflict (user_id, offering_id) do update
    set inventory_id = excluded.inventory_id,
        expires_at = excluded.expires_at
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

    const entitlements = await db.query('select user_id, offering_id from versa_entitlements');
    expect(entitlements.rows).toHaveLength(1);

    const other = await db.query('select redeem_versa_code_and_grant($1, $2) as result', [id, USER_B]);
    expect(other.rows[0].result).toMatchObject({ ok: false, reason: 'reused' });
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
