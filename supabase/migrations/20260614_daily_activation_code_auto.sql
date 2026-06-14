-- Auto-generate daily intern activation codes (midnight Asia/Manila).
-- Run in Supabase SQL Editor if not applied via migration tooling.

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
set search_path = public
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
  if public.current_role() is distinct from 'ADMIN' then
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

-- Midnight Asia/Manila = 16:00 UTC. Enable pg_cron in Supabase Dashboard → Database → Extensions.
create extension if not exists pg_cron with schema extensions;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('spike-daily-activation-code');
    perform cron.schedule(
      'spike-daily-activation-code',
      '0 16 * * *',
      $$select public.ensure_daily_activation_code();$$
    );
  end if;
end;
$cron$;
