-- Hotfix: ensure cohorts.is_active exists (sprint-01 column; missing if only 20260609 ran)
alter table public.cohorts
  add column if not exists is_active boolean not null default true;

-- Ensure at least one cohort row for single-cohort programs
insert into public.cohorts (name, code, is_active, onboarding_phase)
select 'SPIKE Founding Cohort', 'SPIKE-FOUNDING', true, 'suggestions_closed'
where not exists (select 1 from public.cohorts);

-- Link interns without a cohort
update public.intern_progress ip
set cohort_id = (select id from public.cohorts order by id asc limit 1)
where ip.cohort_id is null
  and ip.user_id in (select id from public.profiles where role = 'INTERN');
