-- SPIKE Sprint 06A — Content Studio™ (curriculum CMS)
-- Run AFTER prior sprint migrations. Idempotent.
-- Requires: schema.sql + 20260606_sprint_01_scaffold.sql (segments/weeks/days).
-- Creates `sessions` below if 20260620_sprint_02 was skipped.

-- ------------------------------
-- Prerequisite: sessions (Sprint 02)
-- ------------------------------
create table if not exists public.sessions (
  id bigint generated always as identity primary key,
  day_id bigint not null references public.days(id) on delete cascade,
  session_number integer not null check (session_number >= 1),
  title text not null,
  duration_minutes integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (day_id, session_number)
);

create index if not exists sessions_day_id_idx on public.sessions(day_id);

-- ------------------------------
-- Extend curriculum hierarchy for CMS
-- ------------------------------
alter table public.segments
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists hours numeric(6, 2),
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived'));

alter table public.weeks
  add column if not exists slug text,
  add column if not exists theme text,
  add column if not exists description text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived'));

alter table public.days
  add column if not exists slug text,
  add column if not exists title text,
  add column if not exists theme text,
  add column if not exists description text,
  add column if not exists estimated_hours numeric(4, 2),
  add column if not exists key_concepts jsonb not null default '[]'::jsonb,
  add column if not exists discussion_questions jsonb not null default '[]'::jsonb,
  add column if not exists deliverables jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived'));

alter table public.sessions
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived'));

create unique index if not exists segments_slug_key on public.segments(slug) where slug is not null;
create unique index if not exists weeks_slug_key on public.weeks(slug) where slug is not null;
create unique index if not exists days_slug_key on public.days(slug) where slug is not null;
create unique index if not exists sessions_slug_key on public.sessions(slug) where slug is not null;

-- PRD aliases (views for reporting / future ORM)
create or replace view public.curriculum_segments as
  select
    id,
    slug,
    title,
    description,
    hours,
    sort_order as sequence,
    status,
    created_at,
    updated_at
  from public.segments;

create or replace view public.curriculum_weeks as
  select
    id,
    segment_id,
    slug,
    title,
    theme,
    description,
    sort_order as sequence,
    status,
    created_at,
    updated_at
  from public.weeks;

create or replace view public.curriculum_days as
  select
    id,
    week_id,
    slug,
    title,
    theme,
    description,
    sort_order as sequence,
    estimated_hours,
    learning_objectives,
    key_concepts,
    discussion_questions,
    deliverables,
    status,
    created_at,
    updated_at
  from public.days;

create or replace view public.curriculum_sessions as
  select
    id,
    day_id,
    slug,
    title,
    description,
    session_number,
    duration_minutes,
    sort_order as sequence,
    status,
    created_at
  from public.sessions;

-- ------------------------------
-- Reusable content blocks
-- ------------------------------
create table if not exists public.content_blocks (
  id text primary key,
  block_type text not null check (
    block_type in (
      'text',
      'presentation',
      'video',
      'worksheet',
      'survey',
      'assessment',
      'discussion',
      'reflection',
      'rubric',
      'file',
      'activity',
      'faculty_guide',
      'mentor_guide'
    )
  ),
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  version integer not null default 1,
  author_id uuid references public.profiles(id) on delete set null,
  audience text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists content_blocks_type_status_idx
  on public.content_blocks(block_type, status);

-- Day builder sequence (ordered blocks on a day)
create table if not exists public.day_content_sequences (
  day_slug text not null,
  block_id text not null references public.content_blocks(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (day_slug, block_id)
);

create index if not exists day_content_sequences_day_idx
  on public.day_content_sequences(day_slug, sort_order);

-- Session ↔ block attachment
create table if not exists public.session_content_blocks (
  session_id bigint not null references public.sessions(id) on delete cascade,
  block_id text not null references public.content_blocks(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (session_id, block_id)
);

-- ------------------------------
-- Media library
-- ------------------------------
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  asset_type text not null check (
    asset_type in ('image', 'video', 'pdf', 'pptx', 'template', 'worksheet', 'logo', 'other')
  ),
  storage_path text,
  public_url text,
  mime_type text,
  file_size_bytes bigint,
  tags jsonb not null default '[]'::jsonb,
  segment_slug text,
  week_slug text,
  day_slug text,
  topic text,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_assets_tags_idx on public.content_assets using gin(tags);

-- ------------------------------
-- RLS
-- ------------------------------
alter table public.content_blocks enable row level security;
alter table public.day_content_sequences enable row level security;
alter table public.session_content_blocks enable row level security;
alter table public.content_assets enable row level security;

drop policy if exists content_blocks_select on public.content_blocks;
create policy content_blocks_select on public.content_blocks
  for select to authenticated using (true);

drop policy if exists content_blocks_staff_write on public.content_blocks;
create policy content_blocks_staff_write on public.content_blocks
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists day_content_sequences_select on public.day_content_sequences;
create policy day_content_sequences_select on public.day_content_sequences
  for select to authenticated using (true);

drop policy if exists day_content_sequences_staff_write on public.day_content_sequences;
create policy day_content_sequences_staff_write on public.day_content_sequences
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists session_content_blocks_select on public.session_content_blocks;
create policy session_content_blocks_select on public.session_content_blocks
  for select to authenticated using (true);

drop policy if exists session_content_blocks_staff_write on public.session_content_blocks;
create policy session_content_blocks_staff_write on public.session_content_blocks
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists content_assets_select on public.content_assets;
create policy content_assets_select on public.content_assets
  for select to authenticated using (true);

drop policy if exists content_assets_staff_write on public.content_assets;
create policy content_assets_staff_write on public.content_assets
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------
-- Week 1 preload (Segment 1)
-- ------------------------------
insert into public.segments (segment_number, title, slug, description, hours, sort_order, status)
values (
  1,
  'Segment 1',
  'segment-1',
  'Discover • Decide • Design',
  120,
  1,
  'published'
)
on conflict (segment_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  hours = excluded.hours,
  status = excluded.status,
  updated_at = now();

insert into public.weeks (segment_id, week_number, title, slug, theme, description, sort_order, status)
select
  s.id,
  1,
  'Week 1',
  'week-segment-1-1',
  'Dream • Discover • Decide',
  'Foundation week — identity, industry, market, entrepreneurship, and venture direction.',
  1,
  'published'
from public.segments s
where s.slug = 'segment-1'
on conflict (segment_id, week_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  theme = excluded.theme,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

-- Days 1–5 themes (Content Studio authoring scaffold)
insert into public.days (
  week_id, day_number, slug, title, theme, description, estimated_hours,
  learning_objectives, key_concepts, deliverables, sort_order, status
)
select
  w.id,
  v.day_number,
  v.slug,
  v.title,
  v.theme,
  v.description,
  v.estimated_hours,
  v.learning_objectives::jsonb,
  v.key_concepts::jsonb,
  v.deliverables::jsonb,
  v.day_number,
  v.status
from public.weeks w
cross join (
  values
    (
      1,
      'day-segment-1-week-1-day-1',
      'Day 1',
      'Discover Yourself',
      'Identity, AI Venture Coach, squad formation, and Venture Blueprint builders.',
      4::numeric,
      '["Articulate ambition, impact, and values","Complete Future Self and Dream Board","Form squad and charter"]',
      '["Welcome to SPIKE","Program Overview","AI Venture Coach","Squad Formation"]',
      '["Ambition","Impact","Values","Future Self Narrative","Dream Board","Squad Charter"]',
      'published'
    ),
    (
      2,
      'day-segment-1-week-1-day-2',
      'Day 2',
      'Discover the Industry',
      'Financial services landscape, insurance fundamentals, and observation.',
      4::numeric,
      '["Understand financial services career paths","Conduct industry interviews"]',
      '["Financial Services Overview","Insurance Fundamentals","Role of Advisors"]',
      '["Interview Notes","Research Plan"]',
      'draft'
    ),
    (
      3,
      'day-segment-1-week-1-day-3',
      'Day 3',
      'Discover the Market',
      'Customer problems, personas, and market segmentation.',
      4::numeric,
      '["Identify customer problems and personas"]',
      '["Customer Problems","Market Needs","Customer Personas"]',
      '["Customer Persona","Market Insights"]',
      'draft'
    ),
    (
      4,
      'day-segment-1-week-1-day-4',
      'Day 4',
      'Financial Entrepreneurship',
      'Advisor vs entrepreneur tracks and financial entrepreneurship canvas.',
      4::numeric,
      '["Compare agency builder and specialist tracks"]',
      '["Advisor vs Entrepreneur","Agency Builder Track","Specialist Track"]',
      '["Canvas v1","Track Preference"]',
      'draft'
    ),
    (
      5,
      'day-segment-1-week-1-day-5',
      'Day 5',
      'My Venture Direction',
      '3-year vision, goal setting, and squad presentation.',
      4::numeric,
      '["Present venture blueprint draft and research plan"]',
      '["3-Year Vision","Goal Setting","Presentation Skills"]',
      '["Venture Blueprint Draft v1","Research Presentation"]',
      'draft'
    )
) as v(
  day_number, slug, title, theme, description, estimated_hours,
  learning_objectives, key_concepts, deliverables, status
)
where w.slug = 'week-segment-1-1'
on conflict (week_id, day_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  theme = excluded.theme,
  description = excluded.description,
  estimated_hours = excluded.estimated_hours,
  learning_objectives = excluded.learning_objectives,
  key_concepts = excluded.key_concepts,
  deliverables = excluded.deliverables,
  status = excluded.status,
  updated_at = now();

-- Day 1 session scaffold
insert into public.sessions (day_id, session_number, slug, title, description, duration_minutes, sort_order, status)
select
  d.id,
  1,
  'session-day-1-welcome',
  'Welcome to SPIKE',
  'Program overview and Day 1 orientation.',
  240,
  1,
  'published'
from public.days d
where d.slug = 'day-segment-1-week-1-day-1'
on conflict (day_id, session_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- Seed representative content blocks (Day 1 builders)
insert into public.content_blocks (id, block_type, title, description, payload, status, audience, tags)
values
  (
    'worksheet-ambition-builder',
    'worksheet',
    'Ambition Builder',
    'Guided ambition statement builder via AI Venture Coach.',
    '{"worksheetType":"builder","builderId":"ambition-builder"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","builder"]'::jsonb
  ),
  (
    'worksheet-impact-builder',
    'worksheet',
    'Impact Builder',
    'Impact statement builder.',
    '{"worksheetType":"builder","builderId":"impact-builder"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","builder"]'::jsonb
  ),
  (
    'worksheet-values-builder',
    'worksheet',
    'Values Builder',
    'Values profile builder.',
    '{"worksheetType":"builder","builderId":"values-builder"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","builder"]'::jsonb
  ),
  (
    'worksheet-future-self-builder',
    'worksheet',
    'Future Self Builder',
    'Future self narrative builder.',
    '{"worksheetType":"builder","builderId":"future-self-builder"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","builder"]'::jsonb
  ),
  (
    'activity-dream-board-studio',
    'activity',
    'Dream Board Studio',
    'Visual dream board squad activity.',
    '{"durationMinutes":45,"format":"squad"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","activity"]'::jsonb
  ),
  (
    'activity-squad-charter-builder',
    'activity',
    'Squad Charter Builder',
    'Draft and sign squad charter.',
    '{"durationMinutes":60,"format":"squad"}'::jsonb,
    'published',
    'intern',
    '["segment-1","week-1","day-1","activity"]'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  payload = excluded.payload,
  status = excluded.status,
  tags = excluded.tags,
  updated_at = now();

insert into public.day_content_sequences (day_slug, block_id, sort_order)
values
  ('day-segment-1-week-1-day-1', 'worksheet-ambition-builder', 1),
  ('day-segment-1-week-1-day-1', 'worksheet-impact-builder', 2),
  ('day-segment-1-week-1-day-1', 'worksheet-values-builder', 3),
  ('day-segment-1-week-1-day-1', 'worksheet-future-self-builder', 4),
  ('day-segment-1-week-1-day-1', 'activity-dream-board-studio', 5),
  ('day-segment-1-week-1-day-1', 'activity-squad-charter-builder', 6)
on conflict (day_slug, block_id) do update set sort_order = excluded.sort_order;
