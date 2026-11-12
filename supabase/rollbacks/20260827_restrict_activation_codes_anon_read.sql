-- ROLLBACK NOTE — SEC-1 / F1 activation_codes anon-read restriction.
-- Flavor: safe-partial (policy only; does NOT restore live anon table ALL/TRUNCATE).
-- Umbrella: sec1_f1_safe_partial.sql (Interns supabase/rollbacks/, RA supabase/ra-spike/rollbacks/).
-- Exact live restore: sec1_f1_exact_restore.sql
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.
-- Restores the pre-F1 public-read policy.

drop policy if exists "activation_codes_staff_read" on public.activation_codes;
drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());
