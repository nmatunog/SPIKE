-- SPIKE Sprint 01 — Phase 3 schema scaffolding
-- Run in Supabase SQL Editor AFTER schema.sql (and activation_codes / password_reset if used).
-- Idempotent: safe to re-run on projects that partially applied earlier attempts.

-- ------------------------------
-- Enums
-- ------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'career_track') then
    create type public.career_track as enum ('agency_builder', 'specialist_consultant');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'portfolio_section') then
    create type public.portfolio_section as enum (
      'identity_purpose',
      'market_intelligence',
      'financial_blueprint',
      'professional_development',
      'advisor_startup_blueprint',
      'three_year_blueprint'
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'portfolio_entry_status') then
    create type public.portfolio_entry_status as enum ('pending', 'in_progress', 'completed');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'survey_status') then
    create type public.survey_status as enum ('draft', 'active', 'closed');
  end if;
end$$;

-- ------------------------------
-- Cohorts
-- ------------------------------
create table if not exists public.cohorts (
  id bigint generated always as identity primary key,
  name text not null,
  code text unique,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------
-- Extend intern_progress (replaces participant_profiles)
-- ------------------------------
alter table public.intern_progress
  add column if not exists career_track public.career_track,
  add column if not exists cohort_id bigint references public.cohorts(id) on delete set null,
  add column if not exists current_week integer,
  add column if not exists current_day integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'intern_progress_current_week_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_current_week_check
      check (current_week is null or current_week between 1 and 15);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'intern_progress_current_day_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_current_day_check
      check (current_day is null or current_day between 1 and 5);
  end if;
end$$;

create index if not exists intern_progress_cohort_id_idx on public.intern_progress(cohort_id);

-- ------------------------------
-- Playbook curriculum hierarchy (scaffold — static JS remains fallback in Sprint 01)
-- ------------------------------
create table if not exists public.segments (
  id bigint generated always as identity primary key,
  segment_number integer not null unique check (segment_number between 1 and 3),
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weeks (
  id bigint generated always as identity primary key,
  segment_id bigint not null references public.segments(id) on delete cascade,
  week_number integer not null check (week_number >= 1),
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (segment_id, week_number)
);

create table if not exists public.days (
  id bigint generated always as identity primary key,
  week_id bigint not null references public.weeks(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 5),
  learning_objectives jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, day_number)
);

create table if not exists public.presentations (
  id bigint generated always as identity primary key,
  day_id bigint not null references public.days(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id bigint generated always as identity primary key,
  presentation_id bigint not null references public.presentations(id) on delete cascade,
  title text not null,
  body text,
  asset_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id bigint generated always as identity primary key,
  day_id bigint not null references public.days(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worksheets (
  id bigint generated always as identity primary key,
  day_id bigint not null references public.days(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id bigint generated always as identity primary key,
  day_id bigint not null references public.days(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------
-- Research surveys (scaffold)
-- ------------------------------
create table if not exists public.surveys (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  status public.survey_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------
-- Venture portfolio entries
-- ------------------------------
create table if not exists public.venture_portfolio_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  section public.portfolio_section not null,
  title text not null,
  body text,
  status public.portfolio_entry_status not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venture_portfolio_entries_user_id_idx
  on public.venture_portfolio_entries(user_id);
create index if not exists venture_portfolio_entries_section_idx
  on public.venture_portfolio_entries(section);

-- Curriculum FK indexes
create index if not exists weeks_segment_id_idx on public.weeks(segment_id);
create index if not exists days_week_id_idx on public.days(week_id);
create index if not exists presentations_day_id_idx on public.presentations(day_id);
create index if not exists slides_presentation_id_idx on public.slides(presentation_id);
create index if not exists activities_day_id_idx on public.activities(day_id);
create index if not exists worksheets_day_id_idx on public.worksheets(day_id);
create index if not exists assessments_day_id_idx on public.assessments(day_id);

-- ------------------------------
-- Updated-at triggers (reuses public.set_updated_at from schema.sql)
-- ------------------------------
drop trigger if exists cohorts_set_updated_at on public.cohorts;
create trigger cohorts_set_updated_at
before update on public.cohorts
for each row execute function public.set_updated_at();

drop trigger if exists segments_set_updated_at on public.segments;
create trigger segments_set_updated_at
before update on public.segments
for each row execute function public.set_updated_at();

drop trigger if exists weeks_set_updated_at on public.weeks;
create trigger weeks_set_updated_at
before update on public.weeks
for each row execute function public.set_updated_at();

drop trigger if exists days_set_updated_at on public.days;
create trigger days_set_updated_at
before update on public.days
for each row execute function public.set_updated_at();

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function public.set_updated_at();

drop trigger if exists slides_set_updated_at on public.slides;
create trigger slides_set_updated_at
before update on public.slides
for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists worksheets_set_updated_at on public.worksheets;
create trigger worksheets_set_updated_at
before update on public.worksheets
for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists surveys_set_updated_at on public.surveys;
create trigger surveys_set_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

drop trigger if exists venture_portfolio_entries_set_updated_at on public.venture_portfolio_entries;
create trigger venture_portfolio_entries_set_updated_at
before update on public.venture_portfolio_entries
for each row execute function public.set_updated_at();

-- ------------------------------
-- RLS helpers
-- ------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN');
$$;

-- ------------------------------
-- RLS — cohorts
-- ------------------------------
alter table public.cohorts enable row level security;

drop policy if exists "cohorts_select_authenticated" on public.cohorts;
create policy "cohorts_select_authenticated"
on public.cohorts
for select
using (auth.uid() is not null);

drop policy if exists "cohorts_modify_staff" on public.cohorts;
create policy "cohorts_modify_staff"
on public.cohorts
for all
using (public.is_staff())
with check (public.is_staff());

-- ------------------------------
-- RLS — curriculum tables (read: authenticated; write: staff)
-- ------------------------------
alter table public.segments enable row level security;
alter table public.weeks enable row level security;
alter table public.days enable row level security;
alter table public.presentations enable row level security;
alter table public.slides enable row level security;
alter table public.activities enable row level security;
alter table public.worksheets enable row level security;
alter table public.assessments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'segments', 'weeks', 'days', 'presentations', 'slides',
    'activities', 'worksheets', 'assessments'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_authenticated', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() is not null)',
      t || '_select_authenticated', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_modify_staff', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_staff()) with check (public.is_staff())',
      t || '_modify_staff', t
    );
  end loop;
end$$;

-- ------------------------------
-- RLS — surveys
-- ------------------------------
alter table public.surveys enable row level security;

drop policy if exists "surveys_select_authenticated" on public.surveys;
create policy "surveys_select_authenticated"
on public.surveys
for select
using (auth.uid() is not null);

drop policy if exists "surveys_modify_staff" on public.surveys;
create policy "surveys_modify_staff"
on public.surveys
for all
using (public.is_staff())
with check (public.is_staff());

-- ------------------------------
-- RLS — venture_portfolio_entries
-- ------------------------------
alter table public.venture_portfolio_entries enable row level security;

drop policy if exists "venture_portfolio_entries_select_own_or_staff" on public.venture_portfolio_entries;
create policy "venture_portfolio_entries_select_own_or_staff"
on public.venture_portfolio_entries
for select
using (user_id = auth.uid() or public.is_staff());

drop policy if exists "venture_portfolio_entries_insert_own_or_staff" on public.venture_portfolio_entries;
create policy "venture_portfolio_entries_insert_own_or_staff"
on public.venture_portfolio_entries
for insert
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "venture_portfolio_entries_update_own_or_staff" on public.venture_portfolio_entries;
create policy "venture_portfolio_entries_update_own_or_staff"
on public.venture_portfolio_entries
for update
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "venture_portfolio_entries_delete_staff" on public.venture_portfolio_entries;
create policy "venture_portfolio_entries_delete_staff"
on public.venture_portfolio_entries
for delete
using (public.is_staff());
