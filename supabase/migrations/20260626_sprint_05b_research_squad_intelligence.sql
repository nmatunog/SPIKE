-- SPIKE Sprint 05b — Research Squad Intelligence (cohort analytics)
-- Run AFTER 20260625_sprint_05_blueprint_integration.sql
-- Idempotent: creates research_squads/projects if Sprint 02 was not applied.

-- ------------------------------
-- Prerequisites (Sprint 02 research tables)
-- cohort_id is nullable without FK so this runs even if cohorts table is missing.
-- ------------------------------
create table if not exists public.research_squads (
  id text primary key,
  cohort_id bigint,
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

drop trigger if exists research_squads_set_updated_at on public.research_squads;
create trigger research_squads_set_updated_at before update on public.research_squads
for each row execute function public.set_updated_at();

drop trigger if exists research_projects_set_updated_at on public.research_projects;
create trigger research_projects_set_updated_at before update on public.research_projects
for each row execute function public.set_updated_at();

alter table public.research_squads enable row level security;
alter table public.research_projects enable row level security;

drop policy if exists research_squads_select on public.research_squads;
create policy research_squads_select on public.research_squads
for select using (auth.uid() is not null);

drop policy if exists research_squads_modify_staff on public.research_squads;
create policy research_squads_modify_staff on public.research_squads
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists research_projects_select on public.research_projects;
create policy research_projects_select on public.research_projects
for select using (auth.uid() is not null);

drop policy if exists research_projects_modify_staff on public.research_projects;
create policy research_projects_modify_staff on public.research_projects
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

insert into public.research_squads (id, name, market_segment) values
  ('squad-segment-1-alpha', 'Squad Alpha', 'young_professionals')
on conflict (id) do nothing;

insert into public.research_projects (id, squad_id, title, hypothesis, status) values
  (
    'project-orientation-pulse',
    'squad-segment-1-alpha',
    'Segment 1 Orientation Pulse',
    'Young professionals value entrepreneurship pathways when financial literacy is embedded early.',
    'active'
  )
on conflict (id) do nothing;

-- ------------------------------
-- Sprint 05b tables
-- ------------------------------
create table if not exists public.research_squad_members (
  squad_id text not null references public.research_squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id)
);

create index if not exists research_squad_members_user_id_idx
  on public.research_squad_members(user_id);

create table if not exists public.research_analytics (
  id uuid primary key default gen_random_uuid(),
  squad_id text not null references public.research_squads(id) on delete cascade,
  survey_id text not null,
  response_count int not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (squad_id, survey_id)
);

create index if not exists research_analytics_squad_id_idx on public.research_analytics(squad_id);

drop trigger if exists research_analytics_set_updated_at on public.research_analytics;
create trigger research_analytics_set_updated_at before update on public.research_analytics
for each row execute function public.set_updated_at();

alter table public.research_squad_members enable row level security;
alter table public.research_analytics enable row level security;

drop policy if exists research_squad_members_select on public.research_squad_members;
create policy research_squad_members_select on public.research_squad_members
for select using (auth.uid() is not null);

drop policy if exists research_squad_members_modify_staff on public.research_squad_members;
create policy research_squad_members_modify_staff on public.research_squad_members
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists research_analytics_select_member on public.research_analytics;
create policy research_analytics_select_member on public.research_analytics
for select using (
  auth.uid() is not null
);

drop policy if exists research_analytics_upsert_member on public.research_analytics;
create policy research_analytics_upsert_member on public.research_analytics
for insert with check (auth.uid() is not null);

drop policy if exists research_analytics_update_member on public.research_analytics;
create policy research_analytics_update_member on public.research_analytics
for update using (auth.uid() is not null);
