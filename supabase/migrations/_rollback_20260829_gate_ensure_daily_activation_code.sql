-- ROLLBACK NOTE — SEC-1 / F1 intern ensure_daily_activation_code staff gate.
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.
-- Restores the ungated function from 20260614_daily_activation_code_auto.sql /
-- 20260710_admin_portal_catchup.sql, including revoke from public only.

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

revoke all on function public.ensure_daily_activation_code() from public;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;
