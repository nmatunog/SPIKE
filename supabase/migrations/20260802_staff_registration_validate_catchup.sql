-- Catch-up: validate_staff_registration_code was missing from remote schema cache
-- (staff_registration_config table exists; sibling functions present).

create or replace function public.validate_staff_registration_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
  expires timestamptz;
begin
  select code, expires_at into stored, expires
  from public.staff_registration_config
  where id = 1;

  if stored is null then
    raise exception 'Staff registration is not configured. Ask an administrator.';
  end if;
  if expires < now() then
    raise exception 'Staff registration code has expired. Ask an administrator for a new code.';
  end if;
  if upper(trim(p_code)) <> upper(trim(stored)) then
    raise exception 'Invalid staff registration code.';
  end if;
  return true;
end;
$$;

revoke all on function public.validate_staff_registration_code(text) from public;
grant execute on function public.validate_staff_registration_code(text) to anon, authenticated;

-- Ensure a code row exists (no-op when already seeded).
insert into public.staff_registration_config (id, code, expires_at)
select 1, public.random_staff_code(), now() + interval '90 days'
where not exists (select 1 from public.staff_registration_config where id = 1);

notify pgrst, 'reload schema';
