-- Q1 hardening for SPIKE #7 (repo SQL only — do not apply to hosted DBs from this PR).
-- 1) Gate ensure_daily_activation_code to staff (F1).
-- 2) Durable Versa rate limits.
-- 3) Atomic consume + grant RPC with retry for the same learner.
-- 4) Tighten versa_entitlements read (learner self + admin/superuser only).

-- F1: intern JWTs must not receive plaintext daily codes via SECURITY DEFINER.
create or replace function public.ensure_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
  role text;
begin
  if auth.uid() is not null then
    role := public.current_role();
    if role is distinct from 'FACULTY'
       and role is distinct from 'MENTOR'
       and role is distinct from 'ADMIN'
       and role is distinct from 'SUPERUSER' then
      raise exception 'Only staff can load daily activation codes';
    end if;
  end if;

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

revoke all on function public.ensure_daily_activation_code() from public, anon;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;

create table if not exists public.versa_rate_limits (
  rate_key text primary key,
  fail_count integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.versa_rate_limits enable row level security;

drop policy if exists "versa_rate_limits_staff_read" on public.versa_rate_limits;
create policy "versa_rate_limits_staff_read"
on public.versa_rate_limits
for select
to authenticated
using (public.current_role() in ('ADMIN', 'SUPERUSER'));

drop policy if exists "versa_entitlements_select_self_or_staff" on public.versa_entitlements;
drop policy if exists "versa_entitlements_select_self_or_admin" on public.versa_entitlements;
create policy "versa_entitlements_select_self_or_admin"
on public.versa_entitlements
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_role() in ('ADMIN', 'SUPERUSER')
);

create or replace function public.redeem_versa_code_and_grant(
  p_id bigint,
  p_user_id uuid,
  p_grant_intern boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.versa_code_inventory;
  ent public.versa_entitlements;
begin
  select * into inv from public.versa_code_inventory where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;

  if inv.status = 'redeemed' and inv.redeemed_by = p_user_id then
    insert into public.versa_entitlements (
      user_id, inventory_id, versa_lead_ref, level, offering_id, program_route
    ) values (
      p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route
    )
    on conflict (user_id, offering_id) do update
      set inventory_id = excluded.inventory_id
    returning * into ent;

    if p_grant_intern and inv.program_route = 'spike-interns' and inv.level = 'L1' then
      insert into public.intern_progress (user_id, segment, hours, licensed, program_slug)
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

  update public.versa_code_inventory
     set status = 'redeemed',
         redeemed_at = now(),
         redeemed_by = p_user_id
   where id = p_id
     and status = 'available'
  returning * into inv;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reused');
  end if;

  insert into public.versa_entitlements (
    user_id, inventory_id, versa_lead_ref, level, offering_id, program_route
  ) values (
    p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route
  )
  on conflict (user_id, offering_id) do update
    set inventory_id = excluded.inventory_id
  returning * into ent;

  if p_grant_intern and inv.program_route = 'spike-interns' and inv.level = 'L1' then
    insert into public.intern_progress (user_id, segment, hours, licensed, program_slug)
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

revoke all on function public.redeem_versa_code_and_grant(bigint, uuid, boolean) from public, anon, authenticated;
grant execute on function public.redeem_versa_code_and_grant(bigint, uuid, boolean) to service_role;
