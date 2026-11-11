-- SEC-1 / F1 RA-SPIKE rollback — flavor: safe-partial
-- Concatenation of rollbacks/20260827_*.sql + rollbacks/20260829_*.sql
-- (current branch rollback). Lives here so sync-ra-spike-migrations.sh
-- (`rm -f migrations/*.sql`) cannot delete it. Not on the RA allowlist.
--
-- Restores public-read + ungated ensure(); revoke from public only.
-- Does NOT restore live anon ALL/TRUNCATE or anon EXECUTE.
-- Intern copy: supabase/rollbacks/sec1_f1_safe_partial.sql
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.

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
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;
