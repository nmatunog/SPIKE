-- STEP 2 of 2: Run AFTER 20260703a_superuser_enum.sql has committed successfully.
-- SUPERUSER role, staff self-signup codes, user-admin audit, profile role guard.

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

create table if not exists public.user_admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid,
  action text not null check (action in ('promote', 'edit', 'password_reset', 'delete', 'create')),
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_admin_actions enable row level security;

drop policy if exists user_admin_actions_superuser_read on public.user_admin_actions;
create policy user_admin_actions_superuser_read on public.user_admin_actions
for select
using (public.current_role() = 'SUPERUSER');

create or replace function public.random_staff_code()
returns text
language sql
volatile
set search_path = public
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

create or replace function public.complete_staff_signup(p_role public.app_role, p_name text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_role not in ('FACULTY', 'MENTOR', 'ADMIN') then
    raise exception 'Invalid staff role';
  end if;

  update public.profiles
  set
    role = p_role,
    name = coalesce(nullif(trim(p_name), ''), name)
  where id = auth.uid();
end;
$$;

create or replace function public.profiles_guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.role is distinct from old.role then
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

-- SUPERUSER inherits admin profile policies
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.current_role() in ('ADMIN', 'SUPERUSER'))
with check (id = auth.uid() or public.current_role() in ('ADMIN', 'SUPERUSER'));

drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles
for select
using (id = auth.uid() or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));

revoke all on function public.ensure_staff_registration_code() from public;
revoke all on function public.regenerate_staff_registration_code() from public;
revoke all on function public.validate_staff_registration_code(text) from public;
revoke all on function public.complete_staff_signup(public.app_role, text) from public;

grant execute on function public.ensure_staff_registration_code() to authenticated;
grant execute on function public.regenerate_staff_registration_code() to authenticated;
grant execute on function public.validate_staff_registration_code(text) to anon, authenticated;
grant execute on function public.complete_staff_signup(public.app_role, text) to authenticated;

-- Seed staff code if missing (share from Admin after migration)
insert into public.staff_registration_config (id, code, expires_at)
select 1, public.random_staff_code(), now() + interval '90 days'
where not exists (select 1 from public.staff_registration_config where id = 1);
