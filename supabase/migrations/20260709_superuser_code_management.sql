-- SUPERUSER: daily intern activation codes + staff registration codes (idempotent repair).
-- Run in Supabase SQL Editor if regenerate fails with 404 or "Only administrators".

create extension if not exists pgcrypto with schema extensions;

-- Daily activation: allow SUPERUSER to regenerate
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

revoke all on function public.regenerate_daily_activation_code() from public;
grant execute on function public.regenerate_daily_activation_code() to authenticated;

drop policy if exists "activation_codes_admin_manage" on public.activation_codes;
create policy "activation_codes_admin_manage"
on public.activation_codes
for all
using (public.current_role() in ('ADMIN', 'SUPERUSER'))
with check (public.current_role() in ('ADMIN', 'SUPERUSER'));

-- Staff registration config (safe if 20260703 already ran)
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
