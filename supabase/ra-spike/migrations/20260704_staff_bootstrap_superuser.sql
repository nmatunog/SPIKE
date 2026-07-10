-- First staff signup: no registration code, auto-promote to SUPERUSER.
-- After a SUPERUSER exists, staff signup requires a valid code again.

drop function if exists public.complete_staff_signup(public.app_role, text);

create or replace function public.needs_staff_bootstrap()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where role = 'SUPERUSER'
  );
$$;

create or replace function public.profiles_guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.role is distinct from old.role then
    if current_setting('spike.allow_role_change', true) = '1' then
      return new;
    end if;
    if public.current_role() not in ('ADMIN', 'SUPERUSER') then
      raise exception 'Only administrators can change account roles';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.complete_staff_signup(
  p_role public.app_role,
  p_name text default null,
  p_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap boolean;
  target_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select public.needs_staff_bootstrap() into bootstrap;

  if bootstrap then
    target_role := 'SUPERUSER';
  else
    if p_code is null or length(trim(p_code)) = 0 then
      raise exception 'Staff registration code is required.';
    end if;
    perform public.validate_staff_registration_code(p_code);
    if p_role not in ('FACULTY', 'MENTOR', 'ADMIN') then
      raise exception 'Invalid staff role';
    end if;
    target_role := p_role;
  end if;

  perform set_config('spike.allow_role_change', '1', true);

  update public.profiles
  set
    role = target_role,
    name = coalesce(nullif(trim(p_name), ''), name)
  where id = auth.uid();
end;
$$;

revoke all on function public.needs_staff_bootstrap() from public;
revoke all on function public.complete_staff_signup(public.app_role, text, text) from public;

grant execute on function public.needs_staff_bootstrap() to anon, authenticated;
grant execute on function public.complete_staff_signup(public.app_role, text, text) to authenticated;
