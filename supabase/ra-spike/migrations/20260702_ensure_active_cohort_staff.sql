-- Staff can bootstrap the founding cohort from the dashboard (no SQL editor required).

create or replace function public.ensure_active_cohort()
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.cohorts;
  role text;
begin
  role := public.current_role();
  if role is null or role not in ('FACULTY', 'MENTOR', 'ADMIN') then
    raise exception 'Only staff can set up the founding cohort.';
  end if;

  insert into public.cohorts (name, code, is_active, onboarding_phase)
  select 'SPIKE Founding Cohort', 'SPIKE-FOUNDING', true, 'suggestions_closed'
  where not exists (select 1 from public.cohorts);

  select * into row
  from public.cohorts
  where is_active = true
  order by id
  limit 1;

  if row is null then
    select * into row from public.cohorts order by id limit 1;
  end if;

  if row is null then
    raise exception 'Could not create founding cohort.';
  end if;

  return row;
end;
$$;

revoke all on function public.ensure_active_cohort() from public;
grant execute on function public.ensure_active_cohort() to authenticated;
