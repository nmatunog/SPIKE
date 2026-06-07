-- SPIKE Cohort Identity & Squad Formation System v1.0

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme_statement text not null default '',
  motto text not null default '',
  year integer not null default extract(year from now()),
  batch text not null default 'A',
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cohort_suggestions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  suggested_name text not null default '',
  suggested_motto text not null default '',
  suggested_theme text not null default '',
  votes integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists cohort_suggestions_participant_idx on public.cohort_suggestions(participant_id);

create table if not exists public.squad_themes (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default '⭐',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.squad_theme_items (
  id text primary key,
  theme_id text not null references public.squad_themes(id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default '✦'
);

create index if not exists squad_theme_items_theme_idx on public.squad_theme_items(theme_id);

create table if not exists public.formation_squads (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete set null,
  theme_item_id text references public.squad_theme_items(id) on delete set null,
  name text not null,
  research_market text not null default '',
  mentor_id uuid references public.profiles(id) on delete set null,
  capacity integer not null default 6,
  status text not null default 'forming' check (status in ('forming', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formation_squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.formation_squads(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Member' check (role in (
    'Leader', 'Deputy', 'Research Lead', 'Presentation Lead', 'Documentation Lead', 'Member'
  )),
  joined_at timestamptz not null default now(),
  unique (squad_id, participant_id)
);

create table if not exists public.formation_squad_preferences (
  participant_id uuid not null references public.profiles(id) on delete cascade,
  theme_item_id text not null references public.squad_theme_items(id) on delete cascade,
  rank integer not null check (rank between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (participant_id, rank)
);

create table if not exists public.formation_squad_charters (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.formation_squads(id) on delete cascade unique,
  motto text not null default '',
  commitment_statement text not null default '',
  status text not null default 'draft' check (status in ('draft', 'signing', 'complete', 'approved')),
  generated_pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formation_squad_charter_signatures (
  id uuid primary key default gen_random_uuid(),
  charter_id uuid not null references public.formation_squad_charters(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  signed_at timestamptz not null default now(),
  unique (charter_id, participant_id)
);

create table if not exists public.participant_achievements (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,
  awarded_at timestamptz not null default now(),
  unique (participant_id, badge_key)
);

-- Seed squad themes
insert into public.squad_themes (id, name, description, icon, active) values
  ('constellations', 'Constellations', 'Stars of leadership and initiative', '🌟', true),
  ('explorers', 'Explorers', 'Pioneers who chart new paths', '🧭', true),
  ('entrepreneurship', 'Entrepreneurship', 'Builders of ventures', '🚀', true),
  ('leadership', 'Leadership', 'Teams driven by purpose and impact', '🎯', true)
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.squad_theme_items (id, theme_id, name, description, icon) values
  ('orion', 'constellations', 'Orion', 'Leadership and Initiative', '⭐'),
  ('phoenix', 'constellations', 'Phoenix', 'Resilience and Renewal', '🔥'),
  ('pegasus', 'constellations', 'Pegasus', 'Aspiration and Ambition', '🪽'),
  ('lyra', 'constellations', 'Lyra', 'Harmony and Collaboration', '🎵'),
  ('aquila', 'constellations', 'Aquila', 'Focus and Precision', '🦅'),
  ('draco', 'constellations', 'Draco', 'Strength and Strategy', '🐉'),
  ('magellan', 'explorers', 'Magellan', 'Navigation and Discovery', '🌊'),
  ('earhart', 'explorers', 'Earhart', 'Courage and Breakthrough', '✈️'),
  ('armstrong', 'explorers', 'Armstrong', 'Bold First Steps', '🌙'),
  ('polo', 'explorers', 'Polo', 'Global Perspective', '🌍'),
  ('dagama', 'explorers', 'Da Gama', 'Trade and Connection', '⚓'),
  ('shackleton', 'explorers', 'Shackleton', 'Endurance Under Pressure', '🏔️'),
  ('catalyst', 'entrepreneurship', 'Catalyst', 'Spark innovation', '⚡'),
  ('nexus', 'entrepreneurship', 'Nexus', 'Connect opportunities', '🔗'),
  ('ignite', 'entrepreneurship', 'Ignite', 'Launch momentum', '🔥'),
  ('venture', 'entrepreneurship', 'Venture', 'Build new paths', '💼'),
  ('momentum', 'entrepreneurship', 'Momentum', 'Sustain growth', '📈'),
  ('apex', 'entrepreneurship', 'Apex', 'Reach the summit', '🏆'),
  ('vision', 'leadership', 'Vision', 'See the future clearly', '👁️'),
  ('purpose', 'leadership', 'Purpose', 'Lead with meaning', '🎯'),
  ('impact', 'leadership', 'Impact', 'Create lasting change', '💫'),
  ('integrity', 'leadership', 'Integrity', 'Trust and accountability', '🛡️'),
  ('excellence', 'leadership', 'Excellence', 'Pursue the highest standard', '✨'),
  ('resilience', 'leadership', 'Resilience', 'Rise through challenge', '💪')
on conflict (id) do nothing;

drop trigger if exists cohorts_set_updated_at on public.cohorts;
create trigger cohorts_set_updated_at before update on public.cohorts
for each row execute function public.set_updated_at();

drop trigger if exists formation_squads_set_updated_at on public.formation_squads;
create trigger formation_squads_set_updated_at before update on public.formation_squads
for each row execute function public.set_updated_at();

drop trigger if exists formation_squad_charters_set_updated_at on public.formation_squad_charters;
create trigger formation_squad_charters_set_updated_at before update on public.formation_squad_charters
for each row execute function public.set_updated_at();

alter table public.cohorts enable row level security;
alter table public.cohort_suggestions enable row level security;
alter table public.squad_themes enable row level security;
alter table public.squad_theme_items enable row level security;
alter table public.formation_squads enable row level security;
alter table public.formation_squad_members enable row level security;
alter table public.formation_squad_preferences enable row level security;
alter table public.formation_squad_charters enable row level security;
alter table public.formation_squad_charter_signatures enable row level security;
alter table public.participant_achievements enable row level security;

drop policy if exists cohorts_read on public.cohorts;
create policy cohorts_read on public.cohorts for select using (auth.uid() is not null);

drop policy if exists cohorts_staff on public.cohorts;
create policy cohorts_staff on public.cohorts for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY'))
);

drop policy if exists cohort_suggestions_own on public.cohort_suggestions;
create policy cohort_suggestions_own on public.cohort_suggestions for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists cohort_suggestions_read on public.cohort_suggestions;
create policy cohort_suggestions_read on public.cohort_suggestions for select using (auth.uid() is not null);

drop policy if exists squad_themes_read on public.squad_themes;
create policy squad_themes_read on public.squad_themes for select using (true);

drop policy if exists squad_theme_items_read on public.squad_theme_items;
create policy squad_theme_items_read on public.squad_theme_items for select using (true);

drop policy if exists formation_squads_read on public.formation_squads;
create policy formation_squads_read on public.formation_squads for select using (auth.uid() is not null);

drop policy if exists formation_squads_staff on public.formation_squads;
create policy formation_squads_staff on public.formation_squads for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY', 'MENTOR'))
);

drop policy if exists formation_squad_members_read on public.formation_squad_members;
create policy formation_squad_members_read on public.formation_squad_members for select using (auth.uid() is not null);

drop policy if exists formation_squad_members_staff on public.formation_squad_members;
create policy formation_squad_members_staff on public.formation_squad_members for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY'))
);

drop policy if exists formation_squad_preferences_own on public.formation_squad_preferences;
create policy formation_squad_preferences_own on public.formation_squad_preferences for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists formation_squad_preferences_staff on public.formation_squad_preferences;
create policy formation_squad_preferences_staff on public.formation_squad_preferences for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY', 'MENTOR'))
);

drop policy if exists formation_squad_charters_read on public.formation_squad_charters;
create policy formation_squad_charters_read on public.formation_squad_charters for select using (auth.uid() is not null);

drop policy if exists formation_squad_charters_write on public.formation_squad_charters;
create policy formation_squad_charters_write on public.formation_squad_charters for all using (auth.uid() is not null);

drop policy if exists formation_squad_charter_signatures_own on public.formation_squad_charter_signatures;
create policy formation_squad_charter_signatures_own on public.formation_squad_charter_signatures for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists participant_achievements_own on public.participant_achievements;
create policy participant_achievements_own on public.participant_achievements for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists participant_achievements_staff on public.participant_achievements;
create policy participant_achievements_staff on public.participant_achievements for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY', 'MENTOR'))
);
