-- RA-SPIKE: profile photo onboarding is optional — unblock existing rookies.

update public.intern_progress
set
  onboarding_complete = true,
  onboarding_welcomed_at = coalesce(onboarding_welcomed_at, now())
where program_slug = 'ra-spike'
  and coalesce(onboarding_complete, false) = false;
