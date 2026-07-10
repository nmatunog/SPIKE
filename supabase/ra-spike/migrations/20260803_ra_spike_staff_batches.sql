-- Staff: create RA-SPIKE batches and set the active cohort for coach tools.

create or replace function public.create_ra_spike_batch(
  p_agency text,
  p_unit_manager text,
  p_batch_label text,
  p_invite_code text default null,
  p_start_date date default null,
  p_make_active boolean default true
)
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.cohorts;
  role text := public.current_role();
  agency text := nullif(trim(p_agency), '');
  unit_manager text := nullif(trim(p_unit_manager), '');
  batch_label text := nullif(trim(p_batch_label), '');
  invite_code text := upper(nullif(trim(p_invite_code), ''));
  start_on date := coalesce(p_start_date, current_date);
  cohort_code text;
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;
  if agency is null then raise exception 'Agency is required.'; end if;
  if unit_manager is null then raise exception 'Unit manager is required.'; end if;
  if batch_label is null then raise exception 'Batch label is required.'; end if;

  if invite_code is null then
    invite_code := upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));
  end if;

  if exists (
    select 1 from public.cohorts c
    where upper(c.batch_invite_code) = invite_code
  ) then
    raise exception 'Invite code already in use — choose another.';
  end if;

  if coalesce(p_make_active, true) then
    update public.cohorts set is_active = false where is_active;
  end if;

  cohort_code := 'RA-SPIKE-' || upper(substr(regexp_replace(batch_label, '[^a-zA-Z0-9]+', '-', 'g'), 1, 24));

  insert into public.cohorts (
    name,
    code,
    program_slug,
    agency,
    unit_manager,
    batch_label,
    batch_invite_code,
    signup_open,
    is_active,
    start_date,
    starts_on,
    onboarding_phase
  ) values (
    batch_label,
    cohort_code,
    'ra-spike',
    agency,
    unit_manager,
    batch_label,
    invite_code,
    true,
    coalesce(p_make_active, true),
    start_on,
    start_on,
    'suggestions_closed'
  )
  returning * into row;

  return row;
end;
$$;

create or replace function public.staff_set_active_cohort(p_cohort_id bigint)
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.cohorts;
  role text := public.current_role();
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;

  select * into row from public.cohorts where id = p_cohort_id;
  if not found then raise exception 'Cohort not found.'; end if;

  update public.cohorts set is_active = false where is_active;
  update public.cohorts set is_active = true where id = p_cohort_id
  returning * into row;

  return row;
end;
$$;

revoke all on function public.create_ra_spike_batch(text, text, text, text, date, boolean) from public;
revoke all on function public.staff_set_active_cohort(bigint) from public;

grant execute on function public.create_ra_spike_batch(text, text, text, text, date, boolean) to authenticated;
grant execute on function public.staff_set_active_cohort(bigint) to authenticated;

notify pgrst, 'reload schema';
