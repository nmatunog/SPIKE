-- ROLLBACK NOTE — SEC-1 / F1 RA-SPIKE ensure_daily_activation_code staff gate.
-- Flavor: safe-partial (ungated function; revoke from public only).
-- Umbrella: rollbacks/sec1_f1_safe_partial.sql
-- Exact live restore: rollbacks/sec1_f1_exact_restore.sql
-- Lives in rollbacks/ so scripts/sync-ra-spike-migrations.sh (`rm -f migrations/*.sql`)
-- cannot delete it. Not on the RA migrations allowlist.
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.
-- Restores the ungated function from 20260710_admin_portal_catchup.sql.

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
