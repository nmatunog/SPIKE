-- Map legacy demo unit to canonical Cebu Matunog unit list.

update public.cohorts
set unit_manager = 'CMA Direct'
where coalesce(program_slug, '') = 'ra-spike'
  and coalesce(unit_manager, '') in ('Demo Unit Manager', 'Nilo Matunog');

notify pgrst, 'reload schema';
