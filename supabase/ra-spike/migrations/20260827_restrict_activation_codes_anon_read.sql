-- SEC-1 / F1 (RA-SPIKE copy): drop anon/authenticated public read of intern activation codes.
-- RA-SPIKE signup no longer uses these codes (open signup). Keep intern and RA-SPIKE
-- databases separate.
-- Repo-only. Do NOT apply until Nilo's SEC-1 decision.
-- Rollback: supabase/ra-spike/rollbacks/20260827_restrict_activation_codes_anon_read.sql

drop policy if exists "activation_codes_public_read" on public.activation_codes;

drop policy if exists "activation_codes_staff_read" on public.activation_codes;
create policy "activation_codes_staff_read"
on public.activation_codes
for select
to authenticated
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));
