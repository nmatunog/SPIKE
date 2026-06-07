-- SPIKE Day 1 — Venture Blueprint Builders structured artifacts

create table if not exists public.vision_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  personal_why text not null default '',
  motivation_cards jsonb not null default '[]'::jsonb,
  spike_join_reason text not null default '',
  mission_statement text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.future_self_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  living_location text not null default '',
  target_income text not null default '',
  impact_goal text not null default '',
  career_vision text not null default '',
  narrative text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.dream_board_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  caption text not null default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dream_board_assets_user_idx on public.dream_board_assets(user_id);

create table if not exists public.squad_charters (
  id uuid primary key default gen_random_uuid(),
  squad_id text not null,
  squad_name text not null default '',
  market_segment text not null default '',
  mission text not null default '',
  team_motto text not null default '',
  team_commitment text not null default '',
  member_signatures jsonb not null default '[]'::jsonb,
  faculty_approved boolean not null default false,
  faculty_approved_by uuid references public.profiles(id) on delete set null,
  faculty_approved_at timestamptz,
  charter_pdf_url text,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (squad_id)
);

create table if not exists public.day1_builder_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  builder_id text not null,
  completed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  primary key (user_id, builder_id)
);

drop trigger if exists vision_profiles_set_updated_at on public.vision_profiles;
create trigger vision_profiles_set_updated_at before update on public.vision_profiles
for each row execute function public.set_updated_at();

drop trigger if exists future_self_entries_set_updated_at on public.future_self_entries;
create trigger future_self_entries_set_updated_at before update on public.future_self_entries
for each row execute function public.set_updated_at();

drop trigger if exists dream_board_assets_set_updated_at on public.dream_board_assets;
create trigger dream_board_assets_set_updated_at before update on public.dream_board_assets
for each row execute function public.set_updated_at();

drop trigger if exists squad_charters_set_updated_at on public.squad_charters;
create trigger squad_charters_set_updated_at before update on public.squad_charters
for each row execute function public.set_updated_at();

alter table public.vision_profiles enable row level security;
alter table public.future_self_entries enable row level security;
alter table public.dream_board_assets enable row level security;
alter table public.squad_charters enable row level security;
alter table public.day1_builder_progress enable row level security;

drop policy if exists vision_profiles_own on public.vision_profiles;
create policy vision_profiles_own on public.vision_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vision_profiles_staff_read on public.vision_profiles;
create policy vision_profiles_staff_read on public.vision_profiles
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists future_self_entries_own on public.future_self_entries;
create policy future_self_entries_own on public.future_self_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists future_self_entries_staff_read on public.future_self_entries;
create policy future_self_entries_staff_read on public.future_self_entries
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists dream_board_assets_own on public.dream_board_assets;
create policy dream_board_assets_own on public.dream_board_assets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists dream_board_assets_staff_read on public.dream_board_assets;
create policy dream_board_assets_staff_read on public.dream_board_assets
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);

drop policy if exists squad_charters_read on public.squad_charters;
create policy squad_charters_read on public.squad_charters
for select using (true);

drop policy if exists squad_charters_write on public.squad_charters;
create policy squad_charters_write on public.squad_charters
for all using (
  auth.uid() is not null
) with check (auth.uid() is not null);

drop policy if exists day1_builder_progress_own on public.day1_builder_progress;
create policy day1_builder_progress_own on public.day1_builder_progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists day1_builder_progress_staff_read on public.day1_builder_progress;
create policy day1_builder_progress_staff_read on public.day1_builder_progress
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN'))
);
