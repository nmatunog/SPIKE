-- SPIKE Sprint 04 PR4.3 — Timeline + coaching sessions
-- Run AFTER 20260623_sprint_04_fna_engine.sql

create table if not exists public.participant_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (char_length(event_type) <= 64),
  title text not null check (char_length(title) <= 500),
  module text,
  source_type text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists participant_timeline_events_user_id_idx
  on public.participant_timeline_events(user_id, created_at desc);

create table if not exists public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  session_date date not null default current_date,
  topic text not null check (char_length(topic) <= 200),
  notes text check (notes is null or char_length(notes) <= 4000),
  action_items jsonb not null default '[]'::jsonb,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coaching_sessions_participant_id_idx on public.coaching_sessions(participant_id);

drop trigger if exists coaching_sessions_set_updated_at on public.coaching_sessions;
create trigger coaching_sessions_set_updated_at before update on public.coaching_sessions
for each row execute function public.set_updated_at();

alter table public.participant_timeline_events enable row level security;
alter table public.coaching_sessions enable row level security;

drop policy if exists timeline_events_select_own on public.participant_timeline_events;
create policy timeline_events_select_own on public.participant_timeline_events
for select using (auth.uid() = user_id);

drop policy if exists timeline_events_select_staff on public.participant_timeline_events;
create policy timeline_events_select_staff on public.participant_timeline_events
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists timeline_events_insert_own on public.participant_timeline_events;
create policy timeline_events_insert_own on public.participant_timeline_events
for insert with check (auth.uid() = user_id);

-- Mentors/faculty append coaching and automation events on behalf of participants
drop policy if exists timeline_events_insert_staff on public.participant_timeline_events;
create policy timeline_events_insert_staff on public.participant_timeline_events
for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
);

drop policy if exists coaching_sessions_select_participant on public.coaching_sessions;
create policy coaching_sessions_select_participant on public.coaching_sessions
for select using (auth.uid() = participant_id);

drop policy if exists coaching_sessions_select_staff on public.coaching_sessions;
create policy coaching_sessions_select_staff on public.coaching_sessions
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists coaching_sessions_insert_staff on public.coaching_sessions;
create policy coaching_sessions_insert_staff on public.coaching_sessions
for insert with check (
  auth.uid() = mentor_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
);

drop policy if exists coaching_sessions_update_staff on public.coaching_sessions;
create policy coaching_sessions_update_staff on public.coaching_sessions
for update using (
  auth.uid() = mentor_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
);
