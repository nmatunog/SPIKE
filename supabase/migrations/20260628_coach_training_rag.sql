-- SPIKE Coach AI — training event log + RAG corpus (Phase A + B)
-- Run AFTER 20260627_sprint_06a_content_studio.sql

create table if not exists public.coach_training_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  section_type text not null check (
    section_type in ('ambition', 'impact', 'tagline', 'values', 'future-self')
  ),
  event_type text not null check (event_type in ('accepted', 'regenerated')),
  task text not null,
  input_fields jsonb not null default '{}'::jsonb,
  input_labels jsonb not null default '{}'::jsonb,
  output_text text not null,
  variant text,
  created_at timestamptz not null default now()
);

create index if not exists coach_training_events_section_idx
  on public.coach_training_events (section_type, event_type, created_at desc);

create index if not exists coach_training_events_participant_idx
  on public.coach_training_events (participant_id, created_at desc);

alter table public.coach_training_events enable row level security;

drop policy if exists coach_training_events_insert_own on public.coach_training_events;
create policy coach_training_events_insert_own on public.coach_training_events
for insert
with check (participant_id = auth.uid());

drop policy if exists coach_training_events_select_own on public.coach_training_events;
create policy coach_training_events_select_own on public.coach_training_events
for select
using (participant_id = auth.uid());

drop policy if exists coach_training_events_select_staff on public.coach_training_events;
create policy coach_training_events_select_staff on public.coach_training_events
for select
using (public.is_staff());

-- Anonymized corpus for RAG (no participant_id exposed)
create or replace function public.fetch_coach_rag_examples(
  p_section_type text,
  p_limit int default 50
)
returns table (
  section_type text,
  task text,
  input_labels jsonb,
  output_text text,
  variant text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.section_type,
    e.task,
    e.input_labels,
    e.output_text,
    e.variant
  from public.coach_training_events e
  where e.event_type = 'accepted'
    and e.section_type = p_section_type
    and char_length(trim(e.output_text)) >= 12
  order by e.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

grant execute on function public.fetch_coach_rag_examples(text, int) to authenticated;
