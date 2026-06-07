-- SPIKE Sprint 05 — Venture Blueprint Integration Engine
-- Run AFTER 20260624_sprint_04_timeline_engine.sql

-- Section definitions (reference weights for completion engine)
create table if not exists public.venture_blueprint_sections (
  slug text primary key,
  title text not null,
  weight_pct integer not null check (weight_pct between 0 and 100),
  description text,
  created_at timestamptz not null default now()
);

insert into public.venture_blueprint_sections (slug, title, weight_pct, description) values
  ('vision-purpose', 'Vision & Purpose', 15, 'Mission, vision, reflections, identity'),
  ('canvas', 'Financial Entrepreneurship Canvas', 20, 'Client, talent, leadership engines + foundation'),
  ('market-intelligence', 'Market Intelligence', 15, 'Survey insights and research findings'),
  ('client-growth', 'Client Growth Engine', 15, 'FNA profiles, gaps, recommendations'),
  ('recruitment-growth', 'Recruitment Growth Engine', 15, 'Talent pipeline and development'),
  ('leadership-growth', 'Leadership Growth Engine', 10, 'Culture, systems, coaching journal'),
  ('career-accelerator', 'Career Accelerator', 10, 'ACS progression and promotion readiness')
on conflict (slug) do update set
  title = excluded.title,
  weight_pct = excluded.weight_pct,
  description = excluded.description;

-- Participant field entries (structured Blueprint data)
create table if not exists public.venture_blueprint_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  section_slug text not null references public.venture_blueprint_sections(slug) on delete cascade,
  field_key text not null,
  field_value text not null default '',
  source_type text,
  source_id text,
  updated_at timestamptz not null default now(),
  unique (user_id, section_slug, field_key)
);

create index if not exists venture_blueprint_entries_user_idx on public.venture_blueprint_entries(user_id);
create index if not exists venture_blueprint_entries_section_idx on public.venture_blueprint_entries(section_slug);

-- Canvas engine fields (denormalized for fast canvas reads; mirrors section entries)
create table if not exists public.canvas_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  engine_key text not null check (engine_key in (
    'client_growth', 'talent_growth', 'leadership_growth', 'foundation'
  )),
  field_key text not null,
  field_value text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, engine_key, field_key)
);

create index if not exists canvas_entries_user_idx on public.canvas_entries(user_id);

-- Leadership journal (coaching notes destination)
create table if not exists public.leadership_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  topic text not null default 'Coaching session',
  notes text not null,
  themes text,
  action_plan text,
  source_id text,
  created_at timestamptz not null default now()
);

create index if not exists leadership_journal_user_idx on public.leadership_journal(user_id);

-- Career track selection timestamp on intern_progress
alter table public.intern_progress
  add column if not exists career_track_selected_at timestamptz;

drop trigger if exists venture_blueprint_entries_set_updated_at on public.venture_blueprint_entries;
create trigger venture_blueprint_entries_set_updated_at before update on public.venture_blueprint_entries
for each row execute function public.set_updated_at();

drop trigger if exists canvas_entries_set_updated_at on public.canvas_entries;
create trigger canvas_entries_set_updated_at before update on public.canvas_entries
for each row execute function public.set_updated_at();

-- RLS
alter table public.venture_blueprint_sections enable row level security;
alter table public.venture_blueprint_entries enable row level security;
alter table public.canvas_entries enable row level security;
alter table public.leadership_journal enable row level security;

drop policy if exists venture_blueprint_sections_read_all on public.venture_blueprint_sections;
create policy venture_blueprint_sections_read_all on public.venture_blueprint_sections
for select using (true);

drop policy if exists venture_blueprint_entries_select_own on public.venture_blueprint_entries;
create policy venture_blueprint_entries_select_own on public.venture_blueprint_entries
for select using (auth.uid() = user_id);

drop policy if exists venture_blueprint_entries_select_staff on public.venture_blueprint_entries;
create policy venture_blueprint_entries_select_staff on public.venture_blueprint_entries
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists venture_blueprint_entries_insert_own on public.venture_blueprint_entries;
create policy venture_blueprint_entries_insert_own on public.venture_blueprint_entries
for insert with check (auth.uid() = user_id);

drop policy if exists venture_blueprint_entries_update_own on public.venture_blueprint_entries;
create policy venture_blueprint_entries_update_own on public.venture_blueprint_entries
for update using (auth.uid() = user_id);

drop policy if exists canvas_entries_select_own on public.canvas_entries;
create policy canvas_entries_select_own on public.canvas_entries
for select using (auth.uid() = user_id);

drop policy if exists canvas_entries_select_staff on public.canvas_entries;
create policy canvas_entries_select_staff on public.canvas_entries
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists canvas_entries_insert_own on public.canvas_entries;
create policy canvas_entries_insert_own on public.canvas_entries
for insert with check (auth.uid() = user_id);

drop policy if exists canvas_entries_update_own on public.canvas_entries;
create policy canvas_entries_update_own on public.canvas_entries
for update using (auth.uid() = user_id);

drop policy if exists leadership_journal_select_own on public.leadership_journal;
create policy leadership_journal_select_own on public.leadership_journal
for select using (auth.uid() = user_id);

drop policy if exists leadership_journal_select_staff on public.leadership_journal;
create policy leadership_journal_select_staff on public.leadership_journal
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists leadership_journal_insert_staff on public.leadership_journal;
create policy leadership_journal_insert_staff on public.leadership_journal
for insert with check (
  auth.uid() = mentor_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('MENTOR', 'FACULTY', 'ADMIN')
  )
);

drop policy if exists leadership_journal_insert_own on public.leadership_journal;
create policy leadership_journal_insert_own on public.leadership_journal
for insert with check (auth.uid() = user_id);
