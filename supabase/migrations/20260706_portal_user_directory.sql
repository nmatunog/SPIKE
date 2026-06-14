-- List every Supabase Auth user in the staff directory (including accounts missing public.profiles).
-- Backfill profile rows for auth users that never received one.

insert into public.profiles (id, email, name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'User'
  ),
  'INTERN'::public.app_role
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

create or replace function public.list_portal_users()
returns table (
  id uuid,
  email text,
  name text,
  role public.app_role,
  created_at timestamptz,
  updated_at timestamptz,
  has_profile boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Administrator access is required';
  end if;

  return query
  select
    u.id,
    coalesce(nullif(trim(p.email), ''), u.email, '')::text as email,
    coalesce(
      nullif(trim(p.name), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(u.email, ''), '@', 1),
      'User'
    )::text as name,
    coalesce(p.role, 'INTERN'::public.app_role) as role,
    coalesce(p.created_at, u.created_at) as created_at,
    p.updated_at,
    (p.id is not null) as has_profile
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.created_at, u.created_at) desc;
end;
$$;

create or replace function public.admin_update_portal_user(
  p_user_id uuid,
  p_role public.app_role default null,
  p_name text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_email text;
  auth_name text;
  existing public.profiles;
  row public.profiles;
  final_name text;
  final_role public.app_role;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Administrator access is required';
  end if;

  select
    coalesce(u.email, ''),
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(u.email, ''), '@', 1),
      'User'
    )
  into auth_email, auth_name
  from auth.users u
  where u.id = p_user_id;

  if not found then
    raise exception 'Auth user not found';
  end if;

  select * into existing from public.profiles where id = p_user_id;

  if existing.id is not null and existing.role = 'SUPERUSER'
     and public.current_role() is distinct from 'SUPERUSER' then
    raise exception 'Only superusers can modify superuser accounts';
  end if;

  final_name := coalesce(nullif(trim(p_name), ''), existing.name, auth_name);
  final_role := coalesce(p_role, existing.role, 'INTERN'::public.app_role);

  if final_role = 'SUPERUSER' and public.current_role() is distinct from 'SUPERUSER' then
    raise exception 'Only superusers can assign the SUPERUSER role';
  end if;

  perform set_config('spike.allow_role_change', '1', true);

  insert into public.profiles (id, email, name, role)
  values (
    p_user_id,
    coalesce(nullif(trim(existing.email), ''), auth_email),
    final_name,
    final_role
  )
  on conflict (id) do update
    set
      name = excluded.name,
      role = excluded.role
  returning * into row;

  return row;
end;
$$;

revoke all on function public.list_portal_users() from public;
revoke all on function public.admin_update_portal_user(uuid, public.app_role, text) from public;

grant execute on function public.list_portal_users() to authenticated;
grant execute on function public.admin_update_portal_user(uuid, public.app_role, text) to authenticated;
