-- SEC-1 / F1 read-only post-apply probe.
-- Checks live grants and policies (not the migration catalog).
-- Never writes. Do not run against hosted DBs from a feature-branch build.
--
-- Expected after 20260827 + 20260829:
--   anon_select_activation_codes = false
--   anon_execute_ensure = false
--   anon_execute_regenerate = false
--   public_read_policy_present = false

select
  has_table_privilege('anon', 'public.activation_codes', 'SELECT') as anon_select_activation_codes,
  has_function_privilege(
    'anon',
    'public.ensure_daily_activation_code()',
    'EXECUTE'
  ) as anon_execute_ensure,
  has_function_privilege(
    'anon',
    'public.regenerate_daily_activation_code()',
    'EXECUTE'
  ) as anon_execute_regenerate,
  exists (
    select 1
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'activation_codes'
       and p.polname = 'activation_codes_public_read'
  ) as public_read_policy_present;
