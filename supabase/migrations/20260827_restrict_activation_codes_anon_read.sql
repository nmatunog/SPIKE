-- F1: activation_codes_public_read currently grants SELECT to anon AND authenticated
-- for any unexpired row. That lets unauthenticated clients read today's intern
-- activation code. Validation belongs on the service-role Pages Function.
--
-- Repo-only change. Do NOT apply this to any hosted Supabase project from this PR.

drop policy if exists "activation_codes_public_read" on public.activation_codes;

-- Staff dashboards (faculty/mentor/admin/superuser) still need to display today's code.
drop policy if exists "activation_codes_staff_read" on public.activation_codes;
create policy "activation_codes_staff_read"
on public.activation_codes
for select
to authenticated
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));
