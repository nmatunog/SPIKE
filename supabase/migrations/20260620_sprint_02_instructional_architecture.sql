-- SPIKE Sprint 02 — Instructional architecture (PR7)
-- Run in Supabase SQL Editor AFTER 20260606_sprint_01_scaffold.sql
-- Idempotent: safe to re-run.

-- ------------------------------
-- Programs
-- ------------------------------
create table if not exists public.programs (
  slug text primary key,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------
-- Reference: competencies, milestones, portfolio sections, business plan chapters
-- ------------------------------
create table if not exists public.competencies (
  slug text primary key,
  title text not null,
  category text not null check (category in ('personal', 'technical', 'business', 'leadership')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  slug text primary key,
  segment_slug text not null,
  title text not null,
  target_hour integer not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_sections (
  slug text primary key,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_plan_chapters (
  slug text primary key,
  title text not null,
  description text,
  week_owner integer not null check (week_owner between 1 and 15),
  created_at timestamptz not null default now()
);

create table if not exists public.week_integrations (
  week_slug text primary key,
  business_plan_chapter text not null references public.business_plan_chapters(slug),
  portfolio_section text not null references public.portfolio_sections(slug),
  competency_targets jsonb not null default '[]'::jsonb,
  milestone_review text not null references public.milestones(slug)
);

-- ------------------------------
-- Career tracks (definitions — distinct from intern_progress.career_track enum)
-- ------------------------------
create table if not exists public.career_tracks (
  slug text primary key,
  title text not null,
  framework jsonb not null default '[]'::jsonb,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.track_requirements (
  slug text primary key,
  track_slug text not null references public.career_tracks(slug) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ------------------------------
-- Venture board
-- ------------------------------
create table if not exists public.venture_boards (
  slug text primary key,
  segment_slug text not null,
  title text not null,
  target_hour integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.venture_board_criteria (
  slug text primary key,
  board_slug text not null references public.venture_boards(slug) on delete cascade,
  title text not null,
  weight integer not null check (weight between 0 and 100)
);

-- ------------------------------
-- Playbook integration + day contributions (slug-keyed for JSON import path)
-- ------------------------------
create table if not exists public.day_contributions (
  day_slug text primary key,
  contributes_to_portfolio jsonb not null default '[]'::jsonb,
  contributes_to_business_plan jsonb not null default '[]'::jsonb,
  contributes_to_competencies jsonb not null default '[]'::jsonb
);

create table if not exists public.activity_blueprint_mappings (
  activity_id text primary key,
  portfolio_section text,
  blueprint_module text,
  completion_weight integer not null default 0,
  business_plan_chapter text,
  artifact_title text,
  source_day_id text
);

-- ------------------------------
-- Sessions (under days in curriculum hierarchy)
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
-- Worksheet / survey / rubric extensions
-- ------------------------------
create table if not exists public.worksheet_questions (
  id text primary key,
  worksheet_id bigint references public.worksheets(id) on delete cascade,
  prompt text not null,
  question_type text not null,
  required boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.survey_questions (
  id text primary key,
  survey_id bigint references public.surveys(id) on delete cascade,
  prompt text not null,
  question_type text not null,
  required boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.rubrics (
  id text primary key,
  assessment_id bigint references public.assessments(id) on delete cascade,
  title text not null,
  criteria jsonb not null default '[]'::jsonb
);

-- ------------------------------
-- Participant artifacts (Sprint 02 shape)
-- ------------------------------
create table if not exists public.portfolio_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  section_slug text not null references public.portfolio_sections(slug),
  title text not null,
  content text,
  source_type text,
  source_id text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, section_slug, source_id)
);

create table if not exists public.portfolio_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  notes text,
  score numeric(5, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.business_plan_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chapter_slug text not null references public.business_plan_chapters(slug),
  title text not null,
  content text,
  source_type text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_slug, source_id)
);

-- ------------------------------
-- Research
-- ------------------------------
create table if not exists public.research_squads (
  id text primary key,
  cohort_id bigint references public.cohorts(id) on delete set null,
  name text not null,
  market_segment text not null,
  mentor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_projects (
  id text primary key,
  squad_id text not null references public.research_squads(id) on delete cascade,
  title text not null,
  hypothesis text,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------
-- Updated-at triggers
-- ------------------------------
drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs
for each row execute function public.set_updated_at();

drop trigger if exists portfolio_artifacts_set_updated_at on public.portfolio_artifacts;
create trigger portfolio_artifacts_set_updated_at before update on public.portfolio_artifacts
for each row execute function public.set_updated_at();

drop trigger if exists business_plan_artifacts_set_updated_at on public.business_plan_artifacts;
create trigger business_plan_artifacts_set_updated_at before update on public.business_plan_artifacts
for each row execute function public.set_updated_at();

drop trigger if exists research_squads_set_updated_at on public.research_squads;
create trigger research_squads_set_updated_at before update on public.research_squads
for each row execute function public.set_updated_at();

drop trigger if exists research_projects_set_updated_at on public.research_projects;
create trigger research_projects_set_updated_at before update on public.research_projects
for each row execute function public.set_updated_at();

-- ------------------------------
-- RLS — reference tables (read: authenticated; write: staff)
-- ------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'programs', 'competencies', 'milestones', 'portfolio_sections', 'business_plan_chapters',
    'week_integrations', 'career_tracks', 'track_requirements', 'venture_boards',
    'venture_board_criteria', 'day_contributions', 'activity_blueprint_mappings',
    'worksheet_questions', 'survey_questions', 'rubrics'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_auth', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() is not null)',
      t || '_select_auth', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_modify_staff', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_staff()) with check (public.is_staff())',
      t || '_modify_staff', t
    );
  end loop;
end$$;

alter table public.sessions enable row level security;
drop policy if exists sessions_select_authenticated on public.sessions;
create policy sessions_select_authenticated on public.sessions for select using (auth.uid() is not null);
drop policy if exists sessions_modify_staff on public.sessions;
create policy sessions_modify_staff on public.sessions for all using (public.is_staff()) with check (public.is_staff());

alter table public.portfolio_artifacts enable row level security;
drop policy if exists portfolio_artifacts_select on public.portfolio_artifacts;
create policy portfolio_artifacts_select on public.portfolio_artifacts for select
using (user_id = auth.uid() or public.is_staff());
drop policy if exists portfolio_artifacts_insert on public.portfolio_artifacts;
create policy portfolio_artifacts_insert on public.portfolio_artifacts for insert
with check (user_id = auth.uid() or public.is_staff());
drop policy if exists portfolio_artifacts_update on public.portfolio_artifacts;
create policy portfolio_artifacts_update on public.portfolio_artifacts for update
using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

alter table public.business_plan_artifacts enable row level security;
drop policy if exists business_plan_artifacts_select on public.business_plan_artifacts;
create policy business_plan_artifacts_select on public.business_plan_artifacts for select
using (user_id = auth.uid() or public.is_staff());
drop policy if exists business_plan_artifacts_insert on public.business_plan_artifacts;
create policy business_plan_artifacts_insert on public.business_plan_artifacts for insert
with check (user_id = auth.uid() or public.is_staff());
drop policy if exists business_plan_artifacts_update on public.business_plan_artifacts;
create policy business_plan_artifacts_update on public.business_plan_artifacts for update
using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

alter table public.portfolio_reviews enable row level security;
drop policy if exists portfolio_reviews_select on public.portfolio_reviews;
create policy portfolio_reviews_select on public.portfolio_reviews for select
using (user_id = auth.uid() or public.is_staff() or reviewer_id = auth.uid());
drop policy if exists portfolio_reviews_modify_staff on public.portfolio_reviews;
create policy portfolio_reviews_modify_staff on public.portfolio_reviews for all
using (public.is_staff()) with check (public.is_staff());

alter table public.research_squads enable row level security;
alter table public.research_projects enable row level security;
drop policy if exists research_squads_select on public.research_squads;
create policy research_squads_select on public.research_squads for select using (auth.uid() is not null);
drop policy if exists research_squads_modify_staff on public.research_squads;
create policy research_squads_modify_staff on public.research_squads for all
using (public.is_staff()) with check (public.is_staff());
drop policy if exists research_projects_select on public.research_projects;
create policy research_projects_select on public.research_projects for select using (auth.uid() is not null);
drop policy if exists research_projects_modify_staff on public.research_projects;
create policy research_projects_modify_staff on public.research_projects for all
using (public.is_staff()) with check (public.is_staff());

-- ------------------------------
-- Seed reference data (Segment 1 foundation)
-- ------------------------------
insert into public.programs (slug, title, description) values
  ('spike-600', 'SPIKE Program', 'Full 600-hour SPIKE venture incubator program.')
on conflict (slug) do nothing;

insert into public.competencies (slug, title, category, description) values
  ('competency-visioning', 'Visioning', 'personal', 'Articulate personal and venture vision.'),
  ('competency-goal-setting', 'Goal Setting', 'personal', 'Translate vision into measurable goals.'),
  ('competency-financial-literacy', 'Financial Literacy', 'business', 'Apply foundational financial concepts.'),
  ('competency-financial-needs-analysis', 'Financial Needs Analysis', 'technical', 'Conduct structured needs analysis.'),
  ('competency-client-discovery', 'Client Discovery', 'business', 'Discover client motivations and priorities.'),
  ('competency-risk-management', 'Risk Management', 'business', 'Identify and mitigate risks.'),
  ('competency-prospecting', 'Prospecting', 'business', 'Build a natural market pipeline.'),
  ('competency-presentation-skills', 'Presentation Skills', 'technical', 'Deliver clear presentations.'),
  ('competency-leadership', 'Leadership', 'leadership', 'Demonstrate squad leadership.'),
  ('competency-recruitment-awareness', 'Recruitment Awareness', 'leadership', 'Understand recruitment principles.')
on conflict (slug) do nothing;

insert into public.milestones (slug, segment_slug, title, target_hour, description) values
  ('milestone-40-vision-review', 'segment-1', 'Vision Review', 40, '40-hour vision gate.'),
  ('milestone-80-market-understanding', 'segment-1', 'Market Understanding Review', 80, '80-hour market gate.'),
  ('milestone-120-business-operations', 'segment-1', 'Business Operations Review', 120, '120-hour operations gate.'),
  ('milestone-160-licensing-readiness', 'segment-1', 'Licensing Readiness Review', 160, '160-hour licensing gate.'),
  ('milestone-200-venture-board', 'segment-1', 'Proof of Concept Venture Board', 200, '200-hour capstone board.')
on conflict (slug) do nothing;

insert into public.portfolio_sections (slug, title, description) values
  ('portfolio-identity-purpose', 'Identity & Purpose', 'Personal why and venture identity.'),
  ('portfolio-market-intelligence', 'Market Intelligence', 'Research and market maps.'),
  ('portfolio-financial-blueprint', 'Financial Blueprint', 'Financial literacy and FNA practice.'),
  ('portfolio-professional-development', 'Professional Development', 'Compliance and licensing prep.'),
  ('portfolio-advisor-startup', 'Advisor Startup Blueprint', 'Operations and risk management.'),
  ('portfolio-three-year-blueprint', '3-Year Blueprint', 'Growth plan and board materials.')
on conflict (slug) do nothing;

insert into public.business_plan_chapters (slug, title, description, week_owner) values
  ('bp-chapter-1', 'Vision & Purpose', 'Vision and identity foundation.', 1),
  ('bp-chapter-2', 'Target Market Strategy', 'Target market and positioning.', 2),
  ('bp-chapter-3', 'Client Experience Strategy', 'Client journey and service model.', 3),
  ('bp-chapter-4', 'Professional Standards', 'Compliance and ethics.', 4),
  ('bp-chapter-5', 'Growth Blueprint', '3-year growth synthesis.', 5)
on conflict (slug) do nothing;

insert into public.week_integrations (week_slug, business_plan_chapter, portfolio_section, competency_targets, milestone_review) values
  ('week-segment-1-1', 'bp-chapter-1', 'portfolio-identity-purpose', '["competency-visioning","competency-goal-setting"]', 'milestone-40-vision-review'),
  ('week-segment-1-2', 'bp-chapter-2', 'portfolio-market-intelligence', '["competency-client-discovery","competency-financial-literacy"]', 'milestone-80-market-understanding'),
  ('week-segment-1-3', 'bp-chapter-3', 'portfolio-advisor-startup', '["competency-risk-management"]', 'milestone-120-business-operations'),
  ('week-segment-1-4', 'bp-chapter-4', 'portfolio-professional-development', '["competency-leadership"]', 'milestone-160-licensing-readiness'),
  ('week-segment-1-5', 'bp-chapter-5', 'portfolio-three-year-blueprint', '["competency-presentation-skills","competency-prospecting"]', 'milestone-200-venture-board')
on conflict (week_slug) do nothing;

insert into public.career_tracks (slug, title, framework, description) values
  ('track-agency-builder', 'Agency Builder', '["Educate","Expand","Empower"]', 'Build and scale an agency.'),
  ('track-specialist-consultant', 'Specialist Consultant', '["Educate","Establish","Elevate"]', 'Develop niche authority.')
on conflict (slug) do nothing;

insert into public.venture_boards (slug, segment_slug, title, target_hour) values
  ('venture-board-segment-1-200', 'segment-1', 'Hour 200 Proof of Concept Venture Board', 200)
on conflict (slug) do nothing;

insert into public.venture_board_criteria (slug, board_slug, title, weight) values
  ('vbc-vision-clarity', 'venture-board-segment-1-200', 'Vision Clarity', 20),
  ('vbc-market-understanding', 'venture-board-segment-1-200', 'Market Understanding', 20),
  ('vbc-business-feasibility', 'venture-board-segment-1-200', 'Business Feasibility', 20),
  ('vbc-professional-readiness', 'venture-board-segment-1-200', 'Professional Readiness', 20),
  ('vbc-presentation-quality', 'venture-board-segment-1-200', 'Presentation Quality', 20)
on conflict (slug) do nothing;

insert into public.day_contributions (day_slug, contributes_to_portfolio, contributes_to_business_plan, contributes_to_competencies) values
  ('day-segment-1-week-1-day-1', '["portfolio-identity-purpose"]', '["bp-chapter-1"]', '["competency-visioning","competency-goal-setting"]')
on conflict (day_slug) do nothing;

insert into public.activity_blueprint_mappings (activity_id, portfolio_section, blueprint_module, completion_weight, business_plan_chapter, artifact_title, source_day_id) values
  ('worksheet-day-1-personal-why', 'portfolio-identity-purpose', 'vision', 5, 'bp-chapter-1', 'Personal Why Statement', 'day-segment-1-week-1-day-1')
on conflict (activity_id) do nothing;
