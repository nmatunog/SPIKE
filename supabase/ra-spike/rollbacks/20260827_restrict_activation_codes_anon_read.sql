-- ROLLBACK NOTE — SEC-1 / F1 RA-SPIKE activation_codes anon-read restriction.
-- Flavor: safe-partial (policy only). Umbrella: rollbacks/sec1_f1_safe_partial.sql
-- Exact live restore: rollbacks/sec1_f1_exact_restore.sql
-- Lives in rollbacks/ so scripts/sync-ra-spike-migrations.sh (`rm -f migrations/*.sql`)
-- cannot delete it. Not on the RA migrations allowlist.
-- Do NOT apply unless Nilo decides to undo a previously applied SEC-1 migration.

drop policy if exists "activation_codes_staff_read" on public.activation_codes;
drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());
