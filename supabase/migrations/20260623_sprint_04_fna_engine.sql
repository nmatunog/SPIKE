-- SPIKE Sprint 04 PR4.2 — FNA Engine + client_growth funnel
-- Run AFTER 20260622_sprint_04_survey_engine.sql

create table if not exists public.client_growth (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  prospects integer not null default 0,
  contacts integer not null default 0,
  appointments integer not null default 0,
  fnas integer not null default 0,
  proposals integer not null default 0,
  applications integer not null default 0,
  issued_cases integer not null default 0,
  referrals integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_needs_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_name text not null,
  client_age integer check (client_age is null or client_age between 0 and 120),
  dependents integer not null default 0 check (dependents >= 0),
  income numeric(14, 2),
  assets numeric(14, 2),
  liabilities numeric(14, 2),
  protection_gap numeric(14, 2),
  retirement_gap numeric(14, 2),
  status text not null default 'draft' check (status in ('draft', 'completed', 'presented', 'implemented')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_needs_analyses_user_id_idx on public.financial_needs_analyses(user_id);

create table if not exists public.fna_recommendations (
  id uuid primary key default gen_random_uuid(),
  fna_id uuid not null references public.financial_needs_analyses(id) on delete cascade,
  title text not null,
  description text,
  priority integer not null default 1 check (priority between 1 and 5),
  sort_order integer not null default 0
);

create index if not exists fna_recommendations_fna_id_idx on public.fna_recommendations(fna_id);

drop trigger if exists client_growth_set_updated_at on public.client_growth;
create trigger client_growth_set_updated_at before update on public.client_growth
for each row execute function public.set_updated_at();

drop trigger if exists financial_needs_analyses_set_updated_at on public.financial_needs_analyses;
create trigger financial_needs_analyses_set_updated_at before update on public.financial_needs_analyses
for each row execute function public.set_updated_at();

alter table public.client_growth enable row level security;
alter table public.financial_needs_analyses enable row level security;
alter table public.fna_recommendations enable row level security;

drop policy if exists client_growth_select_own on public.client_growth;
create policy client_growth_select_own on public.client_growth for select using (auth.uid() = user_id);

drop policy if exists client_growth_select_staff on public.client_growth;
create policy client_growth_select_staff on public.client_growth for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists client_growth_upsert_own on public.client_growth;
create policy client_growth_upsert_own on public.client_growth for insert with check (auth.uid() = user_id);

drop policy if exists client_growth_update_own on public.client_growth;
create policy client_growth_update_own on public.client_growth for update using (auth.uid() = user_id);

drop policy if exists fnas_select_own on public.financial_needs_analyses;
create policy fnas_select_own on public.financial_needs_analyses for select using (auth.uid() = user_id);

drop policy if exists fnas_select_staff on public.financial_needs_analyses;
create policy fnas_select_staff on public.financial_needs_analyses for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists fnas_insert_own on public.financial_needs_analyses;
create policy fnas_insert_own on public.financial_needs_analyses for insert with check (auth.uid() = user_id);

drop policy if exists fnas_update_own on public.financial_needs_analyses;
create policy fnas_update_own on public.financial_needs_analyses for update using (auth.uid() = user_id);

drop policy if exists fnas_delete_own on public.financial_needs_analyses;
create policy fnas_delete_own on public.financial_needs_analyses for delete using (auth.uid() = user_id);

drop policy if exists fna_recommendations_select_own on public.fna_recommendations;
create policy fna_recommendations_select_own on public.fna_recommendations for select using (
  exists (select 1 from public.financial_needs_analyses f where f.id = fna_id and f.user_id = auth.uid())
);

drop policy if exists fna_recommendations_select_staff on public.fna_recommendations;
create policy fna_recommendations_select_staff on public.fna_recommendations for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists fna_recommendations_insert_own on public.fna_recommendations;
create policy fna_recommendations_insert_own on public.fna_recommendations for insert with check (
  exists (select 1 from public.financial_needs_analyses f where f.id = fna_id and f.user_id = auth.uid())
);

drop policy if exists fna_recommendations_update_own on public.fna_recommendations;
create policy fna_recommendations_update_own on public.fna_recommendations for update using (
  exists (select 1 from public.financial_needs_analyses f where f.id = fna_id and f.user_id = auth.uid())
);

drop policy if exists fna_recommendations_delete_own on public.fna_recommendations;
create policy fna_recommendations_delete_own on public.fna_recommendations for delete using (
  exists (select 1 from public.financial_needs_analyses f where f.id = fna_id and f.user_id = auth.uid())
);
