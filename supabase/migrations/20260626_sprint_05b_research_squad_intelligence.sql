-- SPIKE Sprint 05b — Research Squad Intelligence (cohort analytics)
-- Run AFTER 20260625_sprint_05_blueprint_integration.sql

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
  exists (
    select 1 from public.research_squad_members m
    where m.squad_id = research_analytics.squad_id and m.user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists research_analytics_upsert_member on public.research_analytics;
create policy research_analytics_upsert_member on public.research_analytics
for insert with check (
  exists (
    select 1 from public.research_squad_members m
    where m.squad_id = research_analytics.squad_id and m.user_id = auth.uid()
  )
);

drop policy if exists research_analytics_update_member on public.research_analytics;
create policy research_analytics_update_member on public.research_analytics
for update using (
  exists (
    select 1 from public.research_squad_members m
    where m.squad_id = research_analytics.squad_id and m.user_id = auth.uid()
  )
);
