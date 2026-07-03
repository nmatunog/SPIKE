-- Remove legacy RA-SPIKE Batch 1 (pre-mixed-cohort demo).
-- Preserves SPIKE Internship interns + squads that still pointed at cohort id 1.

do $$
declare
  old_id bigint;
  new_intern_id bigint;
  intern_count int;
begin
  select c.id into old_id
  from public.cohorts c
  where c.program_slug = 'ra-spike'
    and coalesce(c.batch_label, c.name) ilike 'RA-SPIKE Batch 1%'
  order by c.id
  limit 1;

  if old_id is null then
    return;
  end if;

  select count(*) into intern_count
  from public.intern_progress ip
  where ip.cohort_id = old_id
    and coalesce(ip.program_slug, 'spike-internship') = 'spike-internship';

  if intern_count > 0 then
    insert into public.cohorts (
      name,
      code,
      program_slug,
      is_active,
      signup_open,
      onboarding_phase,
      start_date,
      starts_on
    ) values (
      'SPIKE Internship',
      'SPIKE-INTERN-COHORT',
      'spike-internship',
      true,
      false,
      'suggestions_closed',
      current_date,
      current_date
    )
    returning id into new_intern_id;

    update public.formation_squads
    set cohort_id = new_intern_id
    where cohort_id = old_id;

    update public.intern_progress
    set cohort_id = new_intern_id
    where cohort_id = old_id
      and coalesce(program_slug, 'spike-internship') = 'spike-internship';
  end if;

  delete from public.cohorts where id = old_id;
end $$;

notify pgrst, 'reload schema';
