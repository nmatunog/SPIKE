-- Temporary read-only admin viewer accounts (browse portal, no mutations).

alter table public.profiles
  add column if not exists read_only boolean not null default false;

comment on column public.profiles.read_only is
  'When true for ADMIN, portal mutations are blocked (view-only observer).';

create or replace function public.portal_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.current_role() = 'SUPERUSER' then true
    when public.current_role() = 'ADMIN' then coalesce(
      (select not p.read_only from public.profiles p where p.id = auth.uid()),
      true
    )
    else true
  end;
$$;

revoke all on function public.portal_can_write() from public;
grant execute on function public.portal_can_write() to authenticated, anon;

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.current_role() in ('ADMIN', 'SUPERUSER'))
with check (
  id = auth.uid()
  or public.current_role() = 'SUPERUSER'
  or (public.current_role() = 'ADMIN' and public.portal_can_write())
);

drop policy if exists staff_registration_config_staff_write on public.staff_registration_config;
create policy staff_registration_config_staff_write on public.staff_registration_config
for all
using (
  public.current_role() = 'SUPERUSER'
  or (public.current_role() = 'ADMIN' and public.portal_can_write())
)
with check (
  public.current_role() = 'SUPERUSER'
  or (public.current_role() = 'ADMIN' and public.portal_can_write())
);

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
  if not public.portal_can_write() then
    raise exception 'View-only administrator — cannot change registration codes';
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
  if not public.portal_can_write() then
    raise exception 'View-only administrator — cannot regenerate activation codes';
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
    raise exception 'Only administrators can manage staff registration codes';
  end if;
  if not public.portal_can_write() then
    raise exception 'View-only administrator — cannot change registration codes';
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
