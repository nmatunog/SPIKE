-- Fix starts_on backfill that pointed at cohort-created date (e.g. Thu) instead of Week 1 Day 1 (Mon).
update public.cohorts
set
  start_date = '2026-06-15'::date,
  starts_on = '2026-06-15'::date
where is_active = true;

notify pgrst, 'reload schema';
