-- RA-SPIKE Revalida Panel Rating
-- Rating system for panelists to evaluate squad business pitches

-- ------------------------------
-- Revalida Panel Ratings table
-- ------------------------------
create table if not exists public.revalida_panel_ratings (
  id uuid primary key default gen_random_uuid(),
  panelist_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id bigint not null references public.cohorts(id) on delete cascade,
  squad_id uuid not null references public.formation_squads(id) on delete cascade,
  
  -- Scoring (out of 100 total)
  fvp_score numeric(4,1) not null check (fvp_score >= 0 and fvp_score <= 20),
  business_model_score numeric(4,1) not null check (business_model_score >= 0 and business_model_score <= 25),
  strategy_score numeric(4,1) not null check (strategy_score >= 0 and strategy_score <= 20),
  presentation_score numeric(4,1) not null check (presentation_score >= 0 and presentation_score <= 20),
  investment_score numeric(4,1) not null check (investment_score >= 0 and investment_score <= 15),
  total_score numeric(5,1) generated always as (fvp_score + business_model_score + strategy_score + presentation_score + investment_score) stored,
  
  -- Feedback
  greatest_strength text not null default '',
  improvement text not null default '',
  recommendation text not null check (recommendation in ('ready', 'ready_with_revisions', 'needs_development')),
  standout_participant_id uuid references public.profiles(id) on delete set null,
  
  -- Metadata
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized boolean not null default false,
  
  -- Prevent duplicate ratings from same panelist for same squad
  unique (panelist_id, squad_id)
);

create index if not exists revalida_panel_ratings_cohort_idx on public.revalida_panel_ratings(cohort_id);
create index if not exists revalida_panel_ratings_squad_idx on public.revalida_panel_ratings(squad_id);
create index if not exists revalida_panel_ratings_panelist_idx on public.revalida_panel_ratings(panelist_id);

-- ------------------------------
-- Revalida Results Publishing Control
-- ------------------------------
create table if not exists public.revalida_results_published (
  cohort_id bigint primary key references public.cohorts(id) on delete cascade,
  published boolean not null default false,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null
);

-- ------------------------------
-- Updated-at trigger
-- ------------------------------
drop trigger if exists revalida_panel_ratings_set_updated_at on public.revalida_panel_ratings;
create trigger revalida_panel_ratings_set_updated_at
before update on public.revalida_panel_ratings
for each row execute function public.set_updated_at();

-- ------------------------------
-- RLS policies
-- ------------------------------
alter table public.revalida_panel_ratings enable row level security;
alter table public.revalida_results_published enable row level security;

-- Panelists (staff) can view all ratings
drop policy if exists revalida_panel_ratings_read on public.revalida_panel_ratings;
create policy revalida_panel_ratings_read on public.revalida_panel_ratings
for select using (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
);

-- Panelists can insert their own ratings
drop policy if exists revalida_panel_ratings_insert_own on public.revalida_panel_ratings;
create policy revalida_panel_ratings_insert_own on public.revalida_panel_ratings
for insert with check (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  and panelist_id = auth.uid()
);

-- Panelists can update their own ratings if not finalized
drop policy if exists revalida_panel_ratings_update_own on public.revalida_panel_ratings;
create policy revalida_panel_ratings_update_own on public.revalida_panel_ratings
for update using (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  and panelist_id = auth.uid()
  and finalized = false
);

-- Only admin/superuser can finalize ratings
drop policy if exists revalida_panel_ratings_finalize on public.revalida_panel_ratings;
create policy revalida_panel_ratings_finalize on public.revalida_panel_ratings
for update using (
  public.current_role() in ('ADMIN', 'SUPERUSER')
);

-- Staff can view publication status
drop policy if exists revalida_results_published_read on public.revalida_results_published;
create policy revalida_results_published_read on public.revalida_results_published
for select using (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
);

-- Only admin/superuser can publish results
drop policy if exists revalida_results_published_write on public.revalida_results_published;
create policy revalida_results_published_write on public.revalida_results_published
for all using (
  public.current_role() in ('ADMIN', 'SUPERUSER')
);
