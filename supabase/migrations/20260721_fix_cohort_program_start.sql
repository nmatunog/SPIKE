-- Fix starts_on / start_date backfills (mid-week cohort create, or months-early legacy starts_on).
update public.cohorts
set
  start_date = '2026-06-15'::date,
  starts_on = '2026-06-15'::date
where is_active = true
  and (
    start_date is distinct from '2026-06-15'::date
    or starts_on is distinct from '2026-06-15'::date
    or start_date is null
  );

notify pgrst, 'reload schema';
