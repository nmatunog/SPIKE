-- Production catch-up: admin codes + user directory RPCs (idempotent).
-- Run this in Supabase SQL Editor if the Admin page shows 404 errors for:
--   staff_registration_config, ensure_daily_activation_code, list_portal_users
--
-- Prerequisite: SUPERUSER enum must exist. If not, run 20260703a_superuser_enum.sql first
-- (alone), wait for success, then run this file.
--
-- After success, run separately: NOTIFY pgrst, 'reload schema';

-- gen_random_bytes() lives in pgcrypto (Supabase: extensions schema)
create extension if not exists pgcrypto with schema extensions;

-- ── Daily intern activation codes ─────────────────────────────────────────────

create table if not exists public.activation_codes (
  id bigint generated always as identity primary key,
  date_key date not null unique,
  code text not null,
  expires_at timestamptz not null,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now()
);

alter table public.activation_codes enable row level security;

drop policy if exists "activation_codes_admin_manage" on public.activation_codes;
create policy "activation_codes_admin_manage"
on public.activation_codes
for all
using (public.current_role() in ('ADMIN', 'SUPERUSER'))
with check (public.current_role() in ('ADMIN', 'SUPERUSER'));

drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());

create or replace function public.manila_today()
returns date
language sql
stable
set search_path = public
as $$
  select (timezone('Asia/Manila', now()))::date;
$$;

create or replace function public.manila_end_of_day(target date default public.manila_today())
returns timestamptz
language sql
stable
set search_path = public
as $$
  select ((target + interval '1 day' - interval '1 second') at time zone 'Asia/Manila');
$$;

create or replace function public.random_activation_code()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 6));
$$;

create or replace function public.ensure_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
begin
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

create or replace function public.regenerate_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Only administrators can regenerate activation codes';
  end if;

  insert into public.activation_codes (date_key, code, expires_at, generated_by)
  values (
    today,
    public.random_activation_code(),
    public.manila_end_of_day(today),
    auth.uid()
  )
  on conflict (date_key) do update
    set code = excluded.code,
        expires_at = excluded.expires_at,
        generated_by = excluded.generated_by,
        generated_at = now();

  select * into row from public.activation_codes where date_key = today;
  return row;
end;
$$;

revoke all on function public.ensure_daily_activation_code() from public;
revoke all on function public.regenerate_daily_activation_code() from public;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;
grant execute on function public.regenerate_daily_activation_code() to authenticated;

-- ── Staff registration codes ──────────────────────────────────────────────────

create table if not exists public.staff_registration_config (
  id int primary key default 1 check (id = 1),
  code text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.staff_registration_config enable row level security;

drop policy if exists staff_registration_config_staff_read on public.staff_registration_config;
create policy staff_registration_config_staff_read on public.staff_registration_config
for select
using (public.current_role() in ('ADMIN', 'SUPERUSER'));

drop policy if exists staff_registration_config_staff_write on public.staff_registration_config;
create policy staff_registration_config_staff_write on public.staff_registration_config
for all
using (public.current_role() in ('ADMIN', 'SUPERUSER'))
with check (public.current_role() in ('ADMIN', 'SUPERUSER'));

create or replace function public.random_staff_code()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
$$;

create or replace function public.ensure_staff_registration_code()
returns public.staff_registration_config
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.staff_registration_config;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Only administrators can manage staff registration codes';
  end if;

  insert into public.staff_registration_config (id, code, expires_at, updated_by)
  values (
    1,
    public.random_staff_code(),
    now() + interval '90 days',
    auth.uid()
  )
  on conflict (id) do nothing;

  select * into row from public.staff_registration_config where id = 1;
  return row;
end;
$$;

create or replace function public.regenerate_staff_registration_code()
returns public.staff_registration_config
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.staff_registration_config;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Only administrators can regenerate staff registration codes';
  end if;

  insert into public.staff_registration_config (id, code, expires_at, updated_by)
  values (
    1,
    public.random_staff_code(),
    now() + interval '90 days',
    auth.uid()
  )
  on conflict (id) do update
    set code = excluded.code,
        expires_at = excluded.expires_at,
        updated_at = now(),
        updated_by = excluded.updated_by;

  select * into row from public.staff_registration_config where id = 1;
  return row;
end;
$$;

revoke all on function public.ensure_staff_registration_code() from public;
revoke all on function public.regenerate_staff_registration_code() from public;
grant execute on function public.ensure_staff_registration_code() to authenticated;
grant execute on function public.regenerate_staff_registration_code() to authenticated;

insert into public.staff_registration_config (id, code, expires_at)
select 1, public.random_staff_code(), now() + interval '90 days'
where not exists (select 1 from public.staff_registration_config where id = 1);

-- ── User directory (list + role updates) ──────────────────────────────────────

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
    if new.role = 'SUPERUSER' and public.current_role() is distinct from 'SUPERUSER' then
      raise exception 'Only superusers can assign the SUPERUSER role';
    end if;
    if old.role = 'SUPERUSER' and public.current_role() is distinct from 'SUPERUSER' then
      raise exception 'Only superusers can change superuser accounts';
    end if;
    if public.current_role() not in ('ADMIN', 'SUPERUSER') then
      raise exception 'Only administrators can change account roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on public.profiles;
create trigger profiles_guard_role_change
before update on public.profiles
for each row execute function public.profiles_guard_role_change();

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

-- ── Profile backfill for confirmed auth users missing profiles ────────────────

create or replace function public.sync_missing_portal_profiles()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inserted integer;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Administrator access is required';
  end if;

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

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.sync_missing_portal_profiles() from public;
grant execute on function public.sync_missing_portal_profiles() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_cohort_id bigint;
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'New User'),
    'INTERN'
  )
  on conflict (id) do nothing;

  begin
    select c.id into active_cohort_id
    from public.cohorts c
    where c.is_active = true
    order by c.id
    limit 1;

    if active_cohort_id is null then
      select c.id into active_cohort_id
      from public.cohorts c
      order by c.id
      limit 1;
    end if;

    insert into public.intern_progress (user_id, cohort_id)
    values (new.id, active_cohort_id)
    on conflict (user_id) do nothing;
  exception
    when others then
      null;
  end;

  return row;
end;
$$;

-- Seed today's activation code + backfill any missing profiles
select public.ensure_daily_activation_code();
select public.sync_missing_portal_profiles();
