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
  unique (user_id, offering_id)
);

create table if not exists intern_progress (
  user_id uuid primary key,
  segment integer not null default 1,
  hours numeric not null default 0,
  licensed boolean not null default false,
  program_slug text not null default 'spike-internship'
);

create or replace function redeem_versa_code_and_grant(
  p_id bigint,
  p_user_id uuid,
  p_grant_intern boolean default false
)
returns jsonb
language plpgsql
as $$
declare
  inv versa_code_inventory;
  ent versa_entitlements;
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

    if p_grant_intern and inv.program_route = 'spike-interns' and inv.level = 'L1' then
      insert into intern_progress (user_id, segment, hours, licensed, program_slug)
      values (p_user_id, 1, 0, false, 'spike-internship')
      on conflict (user_id) do nothing;
    end if;

    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'row', to_jsonb(inv),
      'entitlement', to_jsonb(ent)
    );
  end if;

  update versa_code_inventory
     set status = 'redeemed',
         redeemed_at = now(),
         redeemed_by = p_user_id
   where id = p_id
     and status = 'available'
  returning * into inv;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reused');
  end if;

  insert into versa_entitlements (
    user_id, inventory_id, versa_lead_ref, level, offering_id, program_route
  ) values (
    p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route
  )
  on conflict (user_id, offering_id) do update
    set inventory_id = excluded.inventory_id
  returning * into ent;

  if p_grant_intern and inv.program_route = 'spike-interns' and inv.level = 'L1' then
    insert into intern_progress (user_id, segment, hours, licensed, program_slug)
    values (p_user_id, 1, 0, false, 'spike-internship')
    on conflict (user_id) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'already_granted', false,
    'row', to_jsonb(inv),
    'entitlement', to_jsonb(ent)
  );
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
      db.query('select redeem_versa_code_and_grant($1, $2, true) as result', [id, USER_A]),
      db.query('select redeem_versa_code_and_grant($1, $2, true) as result', [id, USER_B]),
    ]);
    const outcomes = [first.rows[0].result, second.rows[0].result];
    const wins = outcomes.filter((row) => row.ok === true && row.already_granted === false);
    const reused = outcomes.filter((row) => row.ok === false && row.reason === 'reused');
    expect(wins).toHaveLength(1);
    expect(reused).toHaveLength(1);

    const inventory = await db.query('select status, redeemed_by from versa_code_inventory where id = $1', [id]);
    expect(inventory.rows[0].status).toBe('redeemed');
    const redeemedBy = inventory.rows[0].redeemed_by;
    expect([USER_A, USER_B]).toContain(redeemedBy);

    const entitlements = await db.query('select user_id from versa_entitlements');
    expect(entitlements.rows).toHaveLength(1);
    expect(entitlements.rows[0].user_id).toBe(redeemedBy);

    const progress = await db.query('select user_id, program_slug from intern_progress');
    expect(progress.rows).toHaveLength(1);
    expect(progress.rows[0]).toMatchObject({ user_id: redeemedBy, program_slug: 'spike-internship' });
  });

  it('recoverable grant: same learner retry recreates a missing entitlement without burning a second code', async () => {
    const id = await boot();
    const first = await db.query('select redeem_versa_code_and_grant($1, $2, true) as result', [id, USER_A]);
    expect(first.rows[0].result.ok).toBe(true);
    expect(first.rows[0].result.already_granted).toBe(false);

    await db.exec('delete from versa_entitlements; delete from intern_progress;');

    const retry = await db.query('select redeem_versa_code_and_grant($1, $2, true) as result', [id, USER_A]);
    expect(retry.rows[0].result.ok).toBe(true);
    expect(retry.rows[0].result.already_granted).toBe(true);

    const entitlements = await db.query('select user_id, offering_id from versa_entitlements');
    expect(entitlements.rows).toHaveLength(1);
    const progress = await db.query('select user_id from intern_progress');
    expect(progress.rows).toHaveLength(1);

    const other = await db.query('select redeem_versa_code_and_grant($1, $2, true) as result', [id, USER_B]);
    expect(other.rows[0].result).toMatchObject({ ok: false, reason: 'reused' });
  });
});
