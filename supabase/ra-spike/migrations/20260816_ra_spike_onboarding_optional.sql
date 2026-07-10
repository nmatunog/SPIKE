-- RA-SPIKE: profile photo is optional — unblock any rookies still on step 3.

update public.intern_progress ip
set
  onboarding_complete = true,
  onboarding_welcomed_at = coalesce(ip.onboarding_welcomed_at, now()),
  program_slug = coalesce(ip.program_slug, 'ra-spike')
where coalesce(ip.program_slug, '') = 'ra-spike'
   or ip.ra_spike_current_week is not null
   or exists (
     select 1 from public.cohorts c
     where c.id = ip.cohort_id and c.program_slug = 'ra-spike'
   )
  and coalesce(ip.onboarding_complete, false) = false;
