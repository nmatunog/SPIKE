-- RA-SPIKE Week 1 portfolio, attendance, and faculty publish unlock.
-- Participant submit no longer auto-advances the week.

-- Stop auto-unlock on participant submit
create or replace function public.submit_ra_spike_week(p_week smallint)
returns public.ra_spike_week_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.ra_spike_week_progress;
  w smallint := greatest(1, least(8, coalesce(p_week, 1)));
begin
  if uid is null then
    raise exception 'Sign in required.';
  end if;

  select * into row
  from public.ra_spike_week_progress
  where user_id = uid and week = w;

  if not found then
    raise exception 'Week progress not found.';
  end if;

  if row.learn_status <> 'complete'
    or row.workshop_status <> 'complete'
    or row.assignment_status <> 'complete'
    or row.reflection_status <> 'complete' then
    raise exception 'Complete Learn, Workshop, Assignment, and Reflection before submitting.';
  end if;

  update public.ra_spike_week_progress
  set
    submit_status = 'complete',
    week_submitted_at = coalesce(week_submitted_at, now()),
    updated_at = now()
  where user_id = uid and week = w
  returning * into row;

  -- Week advance is faculty-only via publish_ra_spike_week.
  return row;
end;
$$;

create table if not exists public.ra_spike_week1_portfolio (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lifestyle_answer text not null default '',
  income_php numeric,
  income_notes text not null default '',
  travel_answer text not null default '',
  lifestyle_image_url text,
  income_image_url text,
  destination_image_url text,
  personal_vision text not null default '',
  blueprint_why text not null default '',
  blueprint_goals jsonb not null default '["","",""]'::jsonb,
  blueprint_income_target text not null default '',
  blueprint_people_to_impact text not null default '',
  blueprint_commitment text not null default '',
  reflection_answers jsonb not null default '{}'::jsonb,
  cards_completed jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  locked boolean not null default false,
  faculty_status text not null default 'pending'
    check (faculty_status in ('pending', 'complete', 'incomplete')),
  faculty_reviewed_at timestamptz,
  faculty_reviewed_by uuid references auth.users(id) on delete set null,
  reopened_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists ra_spike_week1_portfolio_status_idx
  on public.ra_spike_week1_portfolio (faculty_status);

alter table public.ra_spike_week1_portfolio enable row level security;

drop policy if exists ra_spike_week1_portfolio_own on public.ra_spike_week1_portfolio;
create policy ra_spike_week1_portfolio_own on public.ra_spike_week1_portfolio
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists ra_spike_week1_portfolio_staff_read on public.ra_spike_week1_portfolio;
create policy ra_spike_week1_portfolio_staff_read on public.ra_spike_week1_portfolio
  for select
  using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));

create table if not exists public.ra_spike_week1_attendance (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  present boolean not null default false,
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (user_id, session_date)
);

alter table public.ra_spike_week1_attendance enable row level security;

drop policy if exists ra_spike_week1_attendance_own_read on public.ra_spike_week1_attendance;
create policy ra_spike_week1_attendance_own_read on public.ra_spike_week1_attendance
  for select
  using (user_id = auth.uid());

drop policy if exists ra_spike_week1_attendance_staff on public.ra_spike_week1_attendance;
create policy ra_spike_week1_attendance_staff on public.ra_spike_week1_attendance
  for all
  using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'))
  with check (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));

create or replace function public.staff_set_ra_spike_week1_status(
  p_user_id uuid,
  p_status text,
  p_reopen boolean default false
)
returns public.ra_spike_week1_portfolio
language plpgsql
security definer
set search_path = public
as $$
declare
  role text := public.current_role();
  row public.ra_spike_week1_portfolio;
  status text := lower(trim(coalesce(p_status, 'pending')));
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;
  if status not in ('pending', 'complete', 'incomplete') then
    raise exception 'Invalid status.';
  end if;

  insert into public.ra_spike_week1_portfolio (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.ra_spike_week1_portfolio
  set
    faculty_status = status,
    faculty_reviewed_at = now(),
    faculty_reviewed_by = auth.uid(),
    locked = case
      when p_reopen then false
      when status = 'complete' then true
      else locked
    end,
    reopened_at = case when p_reopen then now() else reopened_at end,
    updated_at = now()
  where user_id = p_user_id
  returning * into row;

  return row;
end;
$$;

create or replace function public.publish_ra_spike_week(p_week smallint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  role text := public.current_role();
  w smallint := greatest(1, least(7, coalesce(p_week, 1)));
  next_week smallint := w + 1;
  updated_count integer := 0;
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;

  if w = 1 then
    update public.intern_progress ip
    set
      ra_spike_current_week = next_week,
      ra_spike_segment = case when next_week >= 5 then 2 else coalesce(ra_spike_segment, 1) end
    from public.ra_spike_week1_portfolio p
    where ip.user_id = p.user_id
      and ip.program_slug = 'ra-spike'
      and coalesce(ip.ra_spike_current_week, 1) = 1
      and p.faculty_status = 'complete'
      and p.submitted_at is not null;
  else
    update public.intern_progress
    set
      ra_spike_current_week = next_week,
      ra_spike_segment = case when next_week >= 5 then 2 else coalesce(ra_spike_segment, 1) end
    where program_slug = 'ra-spike'
      and coalesce(ra_spike_current_week, 1) = w;
  end if;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.staff_set_ra_spike_week1_status(uuid, text, boolean) from public;
revoke all on function public.publish_ra_spike_week(smallint) from public;
grant execute on function public.staff_set_ra_spike_week1_status(uuid, text, boolean) to authenticated;
grant execute on function public.publish_ra_spike_week(smallint) to authenticated;

notify pgrst, 'reload schema';
