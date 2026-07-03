-- Allow service-role bootstrap to assign SUPERUSER despite profiles_guard_role_change.

create or replace function public.service_upsert_superuser_profile(
  p_id uuid,
  p_email text,
  p_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null then
    raise exception 'User id is required.';
  end if;

  perform set_config('spike.allow_role_change', '1', true);

  insert into public.profiles (id, email, name, role)
  values (
    p_id,
    lower(trim(p_email)),
    coalesce(nullif(trim(p_name), ''), 'SPIKE Superuser'),
    'SUPERUSER'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    role = 'SUPERUSER';
end;
$$;

revoke all on function public.service_upsert_superuser_profile(uuid, text, text) from public;
grant execute on function public.service_upsert_superuser_profile(uuid, text, text) to service_role;
