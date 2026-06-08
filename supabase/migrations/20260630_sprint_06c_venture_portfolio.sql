-- SPIKE Sprint 06C — Venture Portfolio™ System
-- Run AFTER 20260629_sprint_06b_faculty_mentor_framework.sql

create table if not exists public.venture_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  privacy text not null default 'private' check (privacy in ('private', 'share_link', 'public')),
  photo_url text,
  portfolio_completion integer not null default 0 check (portfolio_completion between 0 and 100),
  blueprint_completion integer not null default 0 check (blueprint_completion between 0 and 100),
  compiled_snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (slug)
);

create index if not exists venture_portfolios_user_idx on public.venture_portfolios(user_id);
create index if not exists venture_portfolios_slug_idx on public.venture_portfolios(slug);

create table if not exists public.venture_portfolio_sections (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.venture_portfolios(id) on delete cascade,
  section_key text not null,
  title text not null,
  completion_pct integer not null default 0 check (completion_pct between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (portfolio_id, section_key)
);

create table if not exists public.portfolio_assets (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.venture_portfolios(id) on delete cascade,
  section_key text not null,
  asset_type text not null,
  title text not null default '',
  content text not null default '',
  media_url text,
  metadata jsonb not null default '{}'::jsonb,
  source_type text,
  source_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_assets_portfolio_idx on public.portfolio_assets(portfolio_id);
create index if not exists portfolio_assets_section_idx on public.portfolio_assets(section_key);

create table if not exists public.portfolio_milestones (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.venture_portfolios(id) on delete cascade,
  milestone_key text not null,
  label text not null,
  target_hour integer,
  achieved_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming', 'in_progress', 'completed')),
  metadata jsonb not null default '{}'::jsonb,
  unique (portfolio_id, milestone_key)
);

create table if not exists public.portfolio_exports (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.venture_portfolios(id) on delete cascade,
  export_type text not null check (export_type in ('pdf', 'pptx', 'share_link')),
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.venture_portfolios enable row level security;
alter table public.venture_portfolio_sections enable row level security;
alter table public.portfolio_assets enable row level security;
alter table public.portfolio_milestones enable row level security;
alter table public.portfolio_exports enable row level security;

drop policy if exists venture_portfolios_select on public.venture_portfolios;
create policy venture_portfolios_select on public.venture_portfolios for select
  using (auth.uid() = user_id or privacy in ('share_link', 'public'));

drop policy if exists venture_portfolios_modify_own on public.venture_portfolios;
create policy venture_portfolios_modify_own on public.venture_portfolios for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists venture_portfolio_sections_select on public.venture_portfolio_sections;
create policy venture_portfolio_sections_select on public.venture_portfolio_sections for select
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id
        and (vp.user_id = auth.uid() or vp.privacy in ('share_link', 'public'))
    )
  );

drop policy if exists venture_portfolio_sections_modify_own on public.venture_portfolio_sections;
create policy venture_portfolio_sections_modify_own on public.venture_portfolio_sections for all
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id and vp.user_id = auth.uid()
    )
  );

drop policy if exists portfolio_assets_select on public.portfolio_assets;
create policy portfolio_assets_select on public.portfolio_assets for select
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id
        and (vp.user_id = auth.uid() or vp.privacy in ('share_link', 'public'))
    )
  );

drop policy if exists portfolio_assets_modify_own on public.portfolio_assets;
create policy portfolio_assets_modify_own on public.portfolio_assets for all
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id and vp.user_id = auth.uid()
    )
  );

drop policy if exists portfolio_milestones_select on public.portfolio_milestones;
create policy portfolio_milestones_select on public.portfolio_milestones for select
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id
        and (vp.user_id = auth.uid() or vp.privacy in ('share_link', 'public'))
    )
  );

drop policy if exists portfolio_milestones_modify_own on public.portfolio_milestones;
create policy portfolio_milestones_modify_own on public.portfolio_milestones for all
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id and vp.user_id = auth.uid()
    )
  );

drop policy if exists portfolio_exports_select on public.portfolio_exports;
create policy portfolio_exports_select on public.portfolio_exports for select
  using (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id and vp.user_id = auth.uid()
    )
  );

drop policy if exists portfolio_exports_insert_own on public.portfolio_exports;
create policy portfolio_exports_insert_own on public.portfolio_exports for insert
  with check (
    exists (
      select 1 from public.venture_portfolios vp
      where vp.id = portfolio_id and vp.user_id = auth.uid()
    )
  );
