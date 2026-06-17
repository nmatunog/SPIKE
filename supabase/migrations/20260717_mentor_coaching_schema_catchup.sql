-- Catch-up: mentor Week 1 coaching schema (if 20260701_sprint_06d was not applied).
-- Fixes console errors on Participant Coaching Card:
--   coaching_sessions.follow_up_required does not exist
--   weekly_mentor_assessments table missing
-- After running in Supabase SQL Editor: NOTIFY pgrst, 'reload schema';

-- coaching_sessions extensions (Sprint 06D)
alter table public.coaching_sessions
  add column if not exists follow_up_required boolean not null default false,
  add column if not exists completed boolean not null default false;

-- mentor_day_guides extensions (harmless if already applied)
alter table public.mentor_day_guides
  add column if not exists theme text,
  add column if not exists observation_areas jsonb not null default '[]'::jsonb;

-- weekly_mentor_assessments (Sprint 06D)
create table if not exists public.weekly_mentor_assessments (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  week integer not null check (week between 1 and 15),
  scores jsonb not null default '{}'::jsonb,
  notes text,
  recommendation text not null default 'continue_normally',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, week)
);

create index if not exists weekly_mentor_assessments_participant_idx
  on public.weekly_mentor_assessments (participant_id, week);

drop trigger if exists weekly_mentor_assessments_set_updated_at on public.weekly_mentor_assessments;
create trigger weekly_mentor_assessments_set_updated_at before update on public.weekly_mentor_assessments
for each row execute function public.set_updated_at();

alter table public.weekly_mentor_assessments enable row level security;

drop policy if exists weekly_mentor_assessments_staff on public.weekly_mentor_assessments;
create policy weekly_mentor_assessments_staff on public.weekly_mentor_assessments
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
);

drop policy if exists weekly_mentor_assessments_participant_read on public.weekly_mentor_assessments;
create policy weekly_mentor_assessments_participant_read on public.weekly_mentor_assessments
for select using (auth.uid() = participant_id);

notify pgrst, 'reload schema';
