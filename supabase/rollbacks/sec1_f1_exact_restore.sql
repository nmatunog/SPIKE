-- SEC-1 / F1 intern rollback — flavor: exact-restore
--
-- Re-grants anon privileges exactly as the Nov 11 2026 read-only check of the
-- live Interns and RA-SPIKE projects found them (migrations 20260827 / 20260829
-- were NOT applied live):
--   * policy activation_codes_public_read
--       FOR SELECT TO anon, authenticated USING (expires_at > now())
--   * anon ALL on table public.activation_codes (SELECT/INSERT/UPDATE/DELETE/
--       TRUNCATE/REFERENCES/TRIGGER)
--   * authenticated TRUNCATE, REFERENCES, TRIGGER on that table
--   * anon EXECUTE on public.ensure_daily_activation_code()
--   * anon EXECUTE on public.regenerate_daily_activation_code()
--   * ungated SECURITY DEFINER ensure_daily_activation_code()
--
-- Do NOT apply unless Nilo decides to undo applied SEC-1 SQL and restore the
-- live leak. Prefer safe-partial if the goal is only to un-gate staff dashboards.
-- RA copy: supabase/ra-spike/rollbacks/sec1_f1_exact_restore.sql

drop policy if exists "activation_codes_staff_read" on public.activation_codes;
drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());

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
grant execute on function public.ensure_daily_activation_code() to anon, authenticated, service_role;
grant execute on function public.regenerate_daily_activation_code() to anon;

grant all on table public.activation_codes to anon;
grant truncate, references, trigger on table public.activation_codes to authenticated;
