-- SPIKE Supabase schema (Phase 2 baseline)
-- Run this in Supabase SQL Editor on a fresh project.
-- This uses Supabase Auth users (auth.users) as identity source.

-- ------------------------------
-- Types
-- ------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('INTERN', 'FACULTY', 'MENTOR', 'ADMIN');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'traction_log_status') then
    create type public.traction_log_status as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
end$$;

-- ------------------------------
-- Core tables
-- ------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.app_role not null default 'INTERN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intern_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  segment integer not null default 1 check (segment between 1 and 3),
  hours integer not null default 0 check (hours between 0 and 600),
  licensed boolean not null default false,
  squad text,
  university text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.traction_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  task text not null,
  hours integer not null check (hours between 1 and 24),
  status public.traction_log_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists traction_logs_user_id_idx on public.traction_logs(user_id);
create index if not exists traction_logs_status_idx on public.traction_logs(status);

-- ------------------------------
-- Updated-at trigger
-- ------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists intern_progress_set_updated_at on public.intern_progress;
create trigger intern_progress_set_updated_at
before update on public.intern_progress
for each row execute function public.set_updated_at();

drop trigger if exists traction_logs_set_updated_at on public.traction_logs;
create trigger traction_logs_set_updated_at
before update on public.traction_logs
for each row execute function public.set_updated_at();

-- ------------------------------
-- Helper function for role checks
-- ------------------------------
create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------
-- Auto-create profile on sign-up
-- ------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'New User'),
    'INTERN'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ------------------------------
-- RLS
-- ------------------------------
alter table public.profiles enable row level security;
alter table public.intern_progress enable row level security;
alter table public.traction_logs enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles
for select
using (id = auth.uid() or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'));

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.current_role() = 'ADMIN')
with check (id = auth.uid() or public.current_role() = 'ADMIN');

-- Intern progress policies
drop policy if exists "intern_progress_select_self_or_staff" on public.intern_progress;
create policy "intern_progress_select_self_or_staff"
on public.intern_progress
for select
using (user_id = auth.uid() or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'));

drop policy if exists "intern_progress_modify_staff_only" on public.intern_progress;
create policy "intern_progress_modify_staff_only"
on public.intern_progress
for all
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'))
with check (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'));

-- Traction logs policies
drop policy if exists "traction_logs_select_own_or_staff" on public.traction_logs;
create policy "traction_logs_select_own_or_staff"
on public.traction_logs
for select
using (user_id = auth.uid() or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'));

drop policy if exists "traction_logs_insert_own" on public.traction_logs;
create policy "traction_logs_insert_own"
on public.traction_logs
for insert
with check (user_id = auth.uid() and status = 'PENDING');

drop policy if exists "traction_logs_review_staff_only" on public.traction_logs;
create policy "traction_logs_review_staff_only"
on public.traction_logs
for update
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'))
with check (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN'));

-- ------------------------------
-- Optional first admin bootstrap (run once manually)
-- replace '<AUTH_USER_UUID>' with the UUID from auth.users.
-- ------------------------------
-- update public.profiles
-- set role = 'ADMIN', name = 'SPIKE Admin'
-- where id = '<AUTH_USER_UUID>'::uuid;
