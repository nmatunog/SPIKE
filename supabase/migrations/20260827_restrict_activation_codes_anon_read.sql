-- F1: activation_codes_public_read currently grants SELECT to anon AND authenticated
-- for any unexpired row. That lets unauthenticated clients read today's intern
-- activation code. Validation belongs on the service-role Pages Function.
--
-- Live (read-only check, Nov 11 2026, both Interns and RA-SPIKE):
--   policy activation_codes_public_read FOR SELECT TO anon, authenticated
--     USING (expires_at > now()) is applied.
--   anon has ALL table privileges on activation_codes, including TRUNCATE.
--   This migration is NOT applied live. Repo-only until Nilo's SEC-1 decision.
--
-- Rollback:
--   safe-partial: supabase/migrations/_rollback_20260827_restrict_activation_codes_anon_read.sql
--                 (also supabase/rollbacks/sec1_f1_safe_partial.sql)
--   exact-restore: supabase/rollbacks/sec1_f1_exact_restore.sql

drop policy if exists "activation_codes_public_read" on public.activation_codes;

-- Staff dashboards (faculty/mentor/admin/superuser) still need to display today's code.
drop policy if exists "activation_codes_staff_read" on public.activation_codes;
create policy "activation_codes_staff_read"
on public.activation_codes
for select
to authenticated
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));

-- Live anon currently holds every table privilege (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/
-- REFERENCES/TRIGGER). Strip them. Authenticated keeps SELECT (RLS staff-read) but
-- must not TRUNCATE / take REFERENCES / attach TRIGGER.
revoke all on table public.activation_codes from anon;
revoke truncate, references, trigger on table public.activation_codes from authenticated;
