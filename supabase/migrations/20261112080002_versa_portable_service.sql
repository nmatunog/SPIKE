-- Portable Versa CSV service (repo SQL only — do not apply to hosted DBs from this PR).
-- Independent of intern signup / activation_codes. Never grants intern role.
-- This is the only redeem RPC on this branch: 2-arg consume + versa_entitlements grant.

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

-- Drop any leftover intern-granting 3-arg signature from earlier drafts.
drop function if exists public.redeem_versa_code_and_grant(bigint, uuid, boolean);

create or replace function public.redeem_versa_code_and_grant(
  p_id bigint,
  p_user_id uuid
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

  return jsonb_build_object(
    'ok', true,
    'already_granted', false,
    'row', to_jsonb(inv),
    'entitlement', to_jsonb(ent)
  );
end;
$$;

revoke all on function public.redeem_versa_code_and_grant(bigint, uuid) from public, anon, authenticated;
grant execute on function public.redeem_versa_code_and_grant(bigint, uuid) to service_role;

create or replace function public.versa_rate_limit_record_fail(
  p_rate_key text,
  p_window_ms integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.versa_rate_limits (rate_key, fail_count, window_start)
  values (p_rate_key, 1, now())
  on conflict (rate_key) do update
    set fail_count = case
      when public.versa_rate_limits.window_start < now() - make_interval(secs => greatest(p_window_ms, 1) / 1000.0)
        then 1
      else public.versa_rate_limits.fail_count + 1
    end,
    window_start = case
      when public.versa_rate_limits.window_start < now() - make_interval(secs => greatest(p_window_ms, 1) / 1000.0)
        then now()
      else public.versa_rate_limits.window_start
    end
  returning fail_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.versa_rate_limit_record_fail(text, integer) from public, anon, authenticated;
grant execute on function public.versa_rate_limit_record_fail(text, integer) to service_role;
