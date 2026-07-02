-- RA-SPIKE Phase 4 — weekly playbook step progress

create table if not exists public.ra_spike_week_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  week smallint not null check (week between 1 and 8),
  learn_status text not null default 'not_started'
    check (learn_status in ('not_started', 'in_progress', 'complete')),
  workshop_status text not null default 'not_started'
    check (workshop_status in ('not_started', 'in_progress', 'complete')),
  assignment_status text not null default 'not_started'
    check (assignment_status in ('not_started', 'in_progress', 'complete')),
  reflection_status text not null default 'not_started'
    check (reflection_status in ('not_started', 'in_progress', 'complete')),
  submit_status text not null default 'not_started'
    check (submit_status in ('not_started', 'in_progress', 'complete')),
  reflection_notes text,
  week_submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

create index if not exists ra_spike_week_progress_user_idx
  on public.ra_spike_week_progress (user_id);

alter table public.ra_spike_week_progress enable row level security;

drop policy if exists ra_spike_week_progress_own on public.ra_spike_week_progress;
create policy ra_spike_week_progress_own on public.ra_spike_week_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Submit week + optionally advance cohort week (interns cannot UPDATE intern_progress directly)
create or replace function public.submit_ra_spike_week(p_week smallint)
returns public.ra_spike_week_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.ra_spike_week_progress;
  prog public.intern_progress;
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

  select * into prog from public.intern_progress where user_id = uid;
  if prog.program_slug = 'ra-spike'
    and coalesce(prog.ra_spike_current_week, 1) = w
    and w < 8 then
    update public.intern_progress
    set
      ra_spike_current_week = w + 1,
      ra_spike_segment = case when w + 1 >= 5 then 2 else coalesce(ra_spike_segment, 1) end
    where user_id = uid;
  end if;

  return row;
end;
$$;

grant execute on function public.submit_ra_spike_week(smallint) to authenticated;
