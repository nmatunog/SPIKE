-- Bind the first verified redeemer's user id atomically at consume time.
-- Repo SQL only — do not apply to hosted DBs from this PR.
-- JS fallback also writes verified_user_id in the same available→redeemed update.

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
         redeemed_by = p_user_id,
         verified_user_id = coalesce(verified_user_id, p_user_id)
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
