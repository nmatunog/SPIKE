-- Allow SUPERUSER to manage cohort onboarding (RLS + ensure_active_cohort RPC).

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER');
$$;

-- cohorts
drop policy if exists cohorts_staff_insert on public.cohorts;
drop policy if exists cohorts_staff_update on public.cohorts;
drop policy if exists cohorts_staff_delete on public.cohorts;
drop policy if exists "cohorts_modify_staff" on public.cohorts;

create policy cohorts_staff_insert on public.cohorts for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

create policy cohorts_staff_update on public.cohorts for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

create policy cohorts_staff_delete on public.cohorts for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

-- cohort_finalists
drop policy if exists cohort_finalists_staff on public.cohort_finalists;
drop policy if exists cohort_finalists_staff_insert on public.cohort_finalists;
drop policy if exists cohort_finalists_staff_update on public.cohort_finalists;
drop policy if exists cohort_finalists_staff_delete on public.cohort_finalists;

create policy cohort_finalists_staff_insert on public.cohort_finalists for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

create policy cohort_finalists_staff_update on public.cohort_finalists for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

create policy cohort_finalists_staff_delete on public.cohort_finalists for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

-- formation_squads
drop policy if exists formation_squads_staff on public.formation_squads;
drop policy if exists formation_squads_staff_insert on public.formation_squads;
drop policy if exists formation_squads_staff_update on public.formation_squads;
drop policy if exists formation_squads_staff_delete on public.formation_squads;

create policy formation_squads_staff_insert on public.formation_squads for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

create policy formation_squads_staff_update on public.formation_squads for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

create policy formation_squads_staff_delete on public.formation_squads for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR', 'SUPERUSER'));

-- formation_squad_members
drop policy if exists formation_squad_members_staff on public.formation_squad_members;
drop policy if exists formation_squad_members_staff_insert on public.formation_squad_members;
drop policy if exists formation_squad_members_staff_update on public.formation_squad_members;
drop policy if exists formation_squad_members_staff_delete on public.formation_squad_members;

create policy formation_squad_members_staff_insert on public.formation_squad_members for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

create policy formation_squad_members_staff_update on public.formation_squad_members for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

create policy formation_squad_members_staff_delete on public.formation_squad_members for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'SUPERUSER'));

-- Bootstrap founding cohort RPC
create or replace function public.ensure_active_cohort()
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.cohorts;
  role public.app_role;
begin
  role := public.current_role();
  if role is null or role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
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
