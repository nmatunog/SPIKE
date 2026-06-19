-- Week 1 Day 1 = Mon 2026-06-15 → Fri 2026-06-19 = Day 5 (Commitment / My Venture Direction)
update public.cohorts
set start_date = '2026-06-15'::date
where is_active = true
  and start_date is distinct from '2026-06-15'::date;
