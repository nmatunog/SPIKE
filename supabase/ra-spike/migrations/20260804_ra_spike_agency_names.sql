-- RA-SPIKE: canonical agency names for rookie signup dropdowns.

update public.cohorts
set agency = 'Cebu Matunog Agency'
where coalesce(program_slug, '') = 'ra-spike'
  and coalesce(agency, '') in ('Matunog District', '');

update public.cohorts
set unit_manager = coalesce(nullif(trim(unit_manager), ''), 'Nilo Matunog')
where coalesce(program_slug, '') = 'ra-spike'
  and coalesce(nullif(trim(unit_manager), ''), '') = '';

notify pgrst, 'reload schema';
