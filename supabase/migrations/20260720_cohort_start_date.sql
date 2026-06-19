-- Program calendar: add start_date (sprint-01 cohorts used starts_on only).
alter table public.cohorts
  add column if not exists start_date date;

-- Backfill from legacy column when present.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cohorts'
      and column_name = 'starts_on'
  ) then
    update public.cohorts
    set start_date = starts_on
    where start_date is null
      and starts_on is not null;
  end if;
end $$;

-- Week 1 Day 1 = Mon 2026-06-15 → Fri 2026-06-19 = Day 5 (Commitment).
update public.cohorts
set start_date = '2026-06-15'::date
where is_active = true;

-- Keep legacy column in sync for older readers.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cohorts'
      and column_name = 'starts_on'
  ) then
    update public.cohorts
    set starts_on = coalesce(starts_on, start_date)
    where is_active = true
      and start_date is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
