-- Fix "stack depth limit exceeded" on cohorts (and related tables).
-- Cause: FOR ALL staff policies subquery profiles while profiles RLS calls current_role() → infinite loop.

-- 1) current_role() must bypass RLS (standard Supabase pattern)
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2) cohorts — all authenticated users SELECT via cohorts_read; staff mutate via role check
drop policy if exists cohorts_staff on public.cohorts;
drop policy if exists cohorts_staff_insert on public.cohorts;
drop policy if exists cohorts_staff_update on public.cohorts;
drop policy if exists cohorts_staff_delete on public.cohorts;

create policy cohorts_staff_insert on public.cohorts for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

create policy cohorts_staff_update on public.cohorts for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

create policy cohorts_staff_delete on public.cohorts for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

-- 3) cohort_finalists — read: cohort_finalists_read; staff write
drop policy if exists cohort_finalists_staff on public.cohort_finalists;
drop policy if exists cohort_finalists_staff_write on public.cohort_finalists;

create policy cohort_finalists_staff_insert on public.cohort_finalists for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY'));

create policy cohort_finalists_staff_update on public.cohort_finalists for update
  using (public.current_role() in ('ADMIN', 'FACULTY'))
  with check (public.current_role() in ('ADMIN', 'FACULTY'));

create policy cohort_finalists_staff_delete on public.cohort_finalists for delete
  using (public.current_role() in ('ADMIN', 'FACULTY'));

-- 4) formation_squads
drop policy if exists formation_squads_staff on public.formation_squads;
drop policy if exists formation_squads_staff_write on public.formation_squads;

create policy formation_squads_staff_insert on public.formation_squads for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

create policy formation_squads_staff_update on public.formation_squads for update
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'))
  with check (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

create policy formation_squads_staff_delete on public.formation_squads for delete
  using (public.current_role() in ('ADMIN', 'FACULTY', 'MENTOR'));

-- 5) formation_squad_members
drop policy if exists formation_squad_members_staff on public.formation_squad_members;
drop policy if exists formation_squad_members_staff_write on public.formation_squad_members;

create policy formation_squad_members_staff_insert on public.formation_squad_members for insert
  with check (public.current_role() in ('ADMIN', 'FACULTY'));

create policy formation_squad_members_staff_update on public.formation_squad_members for update
  using (public.current_role() in ('ADMIN', 'FACULTY'))
  with check (public.current_role() in ('ADMIN', 'FACULTY'));

create policy formation_squad_members_staff_delete on public.formation_squad_members for delete
  using (public.current_role() in ('ADMIN', 'FACULTY'));
