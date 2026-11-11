-- F1: activation_codes_public_read currently grants SELECT to anon AND authenticated
-- for any unexpired row. That lets unauthenticated clients read today's intern
-- activation code. Validation belongs on the service-role Pages Function.
--
-- Repo-only. Do NOT apply to any hosted Supabase project until Nilo's SEC-1
-- decision. Rollback: supabase/migrations/_rollback_20260827_restrict_activation_codes_anon_read.sql

drop policy if exists "activation_codes_public_read" on public.activation_codes;

-- Staff dashboards (faculty/mentor/admin/superuser) still need to display today's code.
drop policy if exists "activation_codes_staff_read" on public.activation_codes;
create policy "activation_codes_staff_read"
on public.activation_codes
for select
to authenticated
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));
