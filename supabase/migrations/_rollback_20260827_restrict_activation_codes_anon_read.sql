-- ROLLBACK NOTE — SEC-1 / F1 intern activation_codes anon-read restriction.
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.
-- Restores the pre-F1 public-read policy from supabase/activation_codes.sql on main.

drop policy if exists "activation_codes_staff_read" on public.activation_codes;
drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());
