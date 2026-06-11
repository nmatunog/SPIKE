-- SPIKE Sprint 06D — Mentor Week 1 Operating Framework
-- Run AFTER 20260629_sprint_06b_faculty_mentor_framework.sql

-- Mentor day guides: theme + observation areas (Week 1 spec)
alter table public.mentor_day_guides
  add column if not exists theme text,
  add column if not exists observation_areas jsonb not null default '[]'::jsonb;

-- Coaching sessions: follow-up flag
alter table public.coaching_sessions
  add column if not exists follow_up_required boolean not null default false,
  add column if not exists completed boolean not null default false;

-- Weekly mentor assessments (Week 1 categories)
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

-- Content Studio block types (coaching_template, observation_form, reflection_form)
alter table public.content_blocks drop constraint if exists content_blocks_block_type_check;
alter table public.content_blocks add constraint content_blocks_block_type_check check (
  block_type in (
    'text', 'presentation', 'video', 'worksheet', 'survey', 'assessment',
    'discussion', 'reflection', 'rubric', 'activity', 'faculty_guide',
    'mentor_guide', 'coaching_template', 'observation_form', 'reflection_form', 'file'
  )
);
