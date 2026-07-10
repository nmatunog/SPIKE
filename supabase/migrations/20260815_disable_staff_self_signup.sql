-- Disable public staff self-signup (registration code). Coaches are created by superuser/admin.

create or replace function public.validate_staff_registration_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Staff self-signup is disabled. Ask a superuser to create your coach account.';
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select public.needs_staff_bootstrap() into bootstrap;

  if not bootstrap then
    raise exception 'Staff self-signup is disabled. Ask a superuser to create your account.';
  end if;

  perform set_config('spike.allow_role_change', '1', true);

  update public.profiles
  set
    role = 'SUPERUSER',
    name = coalesce(nullif(trim(p_name), ''), name)
  where id = auth.uid();
end;
$$;

notify pgrst, 'reload schema';
