-- SEC-1 / F1 (SPIKE Interns): intern JWTs must not receive plaintext daily codes
-- via SECURITY DEFINER ensure_daily_activation_code().
--
-- Live (read-only check, Nov 11 2026): this migration is NOT applied.
-- Live anon has EXECUTE on ensure_daily_activation_code(); the function is
-- SECURITY DEFINER with no role check. Anon / a null auth.uid() must raise.
-- Only staff roles allowed by activation_codes_staff_read get a row back.
--
-- Midnight pg_cron (20260614) calls ensure() with a null auth.uid(). That mint
-- moves to internal mint_daily_activation_code() (returns void; not granted to
-- anon, authenticated, or PUBLIC). ensure() stays staff-only for the RPC.
--
-- regenerate_daily_activation_code() is fail-closed on a null current_role()
-- (live `NOT IN` is NULL when role is null and would skip the RAISE).
--
-- Repo-only. Do NOT apply to any hosted Supabase project until Nilo's SEC-1
-- decision.
-- Rollback:
--   safe-partial: supabase/migrations/_rollback_20260829_gate_ensure_daily_activation_code.sql
--   exact-restore: supabase/rollbacks/sec1_f1_exact_restore.sql

-- Internal mint used by pg_cron. Returns void so a leaked EXECUTE cannot
-- exfiltrate today's code. Owner/superuser (cron) can still call it.
create or replace function public.mint_daily_activation_code()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
begin
  insert into public.activation_codes (date_key, code, expires_at, generated_by)
  values (
    today,
    public.random_activation_code(),
    public.manila_end_of_day(today),
    auth.uid()
  )
  on conflict (date_key) do nothing;
end;
$$;

revoke all on function public.mint_daily_activation_code() from public, anon, authenticated;

create or replace function public.ensure_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
  role text;
begin
  -- Fail closed for anon and any session without a JWT subject.
  if auth.uid() is null then
    raise exception 'Only staff can load daily activation codes';
  end if;

  role := public.current_role();
  if role is distinct from 'FACULTY'
     and role is distinct from 'MENTOR'
     and role is distinct from 'ADMIN'
     and role is distinct from 'SUPERUSER' then
    raise exception 'Only staff can load daily activation codes';
  end if;

  perform public.mint_daily_activation_code();

  select * into row from public.activation_codes where date_key = today;
  return row;
end;
$$;

revoke all on function public.ensure_daily_activation_code() from public, anon;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;

-- Live body (20260718) used `current_role() not in (...)` which is NULL when
-- the role is null (no profile). Fail closed. Signature matches
-- 20260614 / 20260709 / 20260710 / 20260718: no arguments.
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
  if auth.uid() is null then
    raise exception 'Only administrators can regenerate activation codes';
  end if;
  if public.current_role() is distinct from 'ADMIN'
     and public.current_role() is distinct from 'SUPERUSER' then
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

-- Live anon also holds EXECUTE on regenerate (default schema grants).
-- Revoke PUBLIC as well: REVOKE FROM anon alone does not drop the PUBLIC grant.
revoke execute on function public.regenerate_daily_activation_code() from anon;
revoke execute on function public.regenerate_daily_activation_code() from public;

-- Reschedule midnight mint onto the internal void function. No-op when pg_cron
-- (or a test stub of cron.schedule) is absent.
do $cron$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is null then
    return;
  end if;
  begin
    perform cron.unschedule('spike-daily-activation-code');
  exception when others then
    null;
  end;
  perform cron.schedule(
    'spike-daily-activation-code',
    '0 16 * * *',
    $cmd$select public.mint_daily_activation_code();$cmd$
  );
end;
$cron$;
