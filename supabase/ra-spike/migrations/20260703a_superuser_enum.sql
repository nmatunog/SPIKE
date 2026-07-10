-- STEP 1 of 2: Run this alone in Supabase SQL Editor, wait for success, then run
-- 20260703_superuser_staff_accounts.sql
--
-- PostgreSQL cannot use a new enum value in the same transaction it was added.

alter type public.app_role add value if not exists 'SUPERUSER';
