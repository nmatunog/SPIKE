-- Versa PRO monthly term (option B: a new code each month).
-- Nilo / Versa Nov 12 2026 1:57 PM. Repo SQL only — do not apply to hosted DBs.
-- Duration is server-side (p_period_days, default 30), never CSV DurationDays.
-- Access after expiry+grace is lazy; this function does not lapse rows.

alter table public.versa_entitlements
  add column if not exists expires_at timestamptz;

comment on column public.versa_entitlements.expires_at is
  'PRO L2 period end. null = non-expiring (FREE). new_expiry = max(now, current) + period.';

drop function if exists public.redeem_versa_code_and_grant(bigint, uuid);

create or replace function public.redeem_versa_code_and_grant(
  p_id bigint,
  p_user_id uuid,
  p_period_days integer default 30,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.versa_code_inventory;
  ent public.versa_entitlements;
  period_days integer := greatest(coalesce(p_period_days, 30), 0);
  at timestamptz := coalesce(p_now, now());
  next_expiry timestamptz;
begin
  select * into inv from public.versa_code_inventory where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;

  if inv.status = 'redeemed' and inv.redeemed_by = p_user_id then
    insert into public.versa_entitlements (
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

  update public.versa_code_inventory
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
      from public.versa_entitlements
     where user_id = p_user_id and offering_id = inv.offering_id;
    next_expiry := greatest(at, coalesce(next_expiry, at)) + make_interval(days => period_days);
  else
    next_expiry := null;
  end if;

  insert into public.versa_entitlements (
    user_id, inventory_id, versa_lead_ref, level, offering_id, program_route, expires_at
  ) values (
    p_user_id, inv.id, inv.versa_lead_ref, inv.level, inv.offering_id, inv.program_route, next_expiry
  )
  on conflict (user_id, offering_id) do update
    set inventory_id = excluded.inventory_id,
        versa_lead_ref = excluded.versa_lead_ref,
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

revoke all on function public.redeem_versa_code_and_grant(bigint, uuid, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.redeem_versa_code_and_grant(bigint, uuid, integer, timestamptz) to service_role;
