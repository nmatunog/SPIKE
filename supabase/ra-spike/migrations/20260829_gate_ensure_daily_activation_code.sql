-- SEC-1 / F1 (SPIKE Interns): intern JWTs must not receive plaintext daily codes
-- via SECURITY DEFINER ensure_daily_activation_code().
--
-- Live (read-only check, Nov 11 2026): this migration is NOT applied.
-- Live anon has EXECUTE on ensure_daily_activation_code(); the function is
-- SECURITY DEFINER with no role check. Anon / a null auth.uid() must raise.
-- Only staff roles allowed by activation_codes_staff_read get a row back.
--
-- Repo-only. Do NOT apply to any hosted Supabase project until Nilo's SEC-1
-- decision.
-- Rollback:
--   safe-partial: supabase/migrations/_rollback_20260829_gate_ensure_daily_activation_code.sql
--   exact-restore: supabase/rollbacks/sec1_f1_exact_restore.sql

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

revoke all on function public.ensure_daily_activation_code() from public, anon;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;

-- Live anon also holds EXECUTE on regenerate (default schema grants). Signature
-- matches 20260614 / 20260709 / 20260710 / 20260718: no arguments.
-- Revoke PUBLIC as well: REVOKE FROM anon alone does not drop the PUBLIC grant.
revoke execute on function public.regenerate_daily_activation_code() from anon;
revoke execute on function public.regenerate_daily_activation_code() from public;
