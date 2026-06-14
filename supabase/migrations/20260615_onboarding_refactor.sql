-- SPIKE Onboarding Refactor — cohort-first flow (bigint cohorts canonical)

do $$ begin
  create type public.cohort_onboarding_phase as enum (
    'suggestions_closed',
    'suggestions_open',
    'finalists_ready',
    'voting_open',
    'voting_closed',
    'winner_revealed',
    'cohort_photo_complete',
    'squads_assigned',
    'onboarding_complete'
  );
exception
  when duplicate_object then null;
end $$;

-- Extend sprint-01 cohorts (bigint id)
alter table public.cohorts
  add column if not exists onboarding_phase public.cohort_onboarding_phase not null default 'suggestions_closed',
  add column if not exists official_name text,
  add column if not exists photo_url text,
  add column if not exists theme_statement text not null default '',
  add column if not exists motto text not null default '',
  add column if not exists suggestions_opened_at timestamptz,
  add column if not exists voting_opened_at timestamptz,
  add column if not exists voting_closed_at timestamptz,
  add column if not exists revealed_at timestamptz,
  add column if not exists finalists_generated_at timestamptz,
  add column if not exists finalists_generated_by uuid references public.profiles(id) on delete set null;

alter table public.intern_progress
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists onboarding_welcomed_at timestamptz;

-- cohort_suggestions (participant individual proposals)
create table if not exists public.cohort_suggestions (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint not null references public.cohorts(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  suggested_name text not null default '',
  reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, participant_id)
);

alter table public.cohort_suggestions
  add column if not exists cohort_id bigint references public.cohorts(id) on delete cascade,
  add column if not exists reason text not null default '';

create index if not exists cohort_suggestions_cohort_idx on public.cohort_suggestions(cohort_id);
create index if not exists cohort_suggestions_participant_idx on public.cohort_suggestions(participant_id);

create table if not exists public.cohort_finalists (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint not null references public.cohorts(id) on delete cascade,
  display_order integer not null default 0,
  name text not null,
  source_suggestion_ids jsonb not null default '[]'::jsonb,
  edited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cohort_finalists_cohort_idx on public.cohort_finalists(cohort_id);

create table if not exists public.cohort_votes (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint not null references public.cohorts(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  finalist_id uuid not null references public.cohort_finalists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cohort_id, participant_id)
);

create index if not exists cohort_votes_cohort_idx on public.cohort_votes(cohort_id);
create index if not exists cohort_votes_finalist_idx on public.cohort_votes(finalist_id);

-- Squad themes (from 20260609 — idempotent)
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

create table if not exists public.formation_squads (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint references public.cohorts(id) on delete set null,
  theme_item_id text references public.squad_theme_items(id) on delete set null,
  name text not null default '',
  motto text not null default '',
  photo_url text,
  research_market text not null default '',
  mentor_id uuid references public.profiles(id) on delete set null,
  capacity integer not null default 3,
  status text not null default 'forming' check (status in ('forming', 'active', 'archived')),
  registered_at timestamptz,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.formation_squads
  add column if not exists motto text not null default '',
  add column if not exists photo_url text,
  add column if not exists registered_at timestamptz,
  add column if not exists onboarding_complete boolean not null default false;

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

insert into public.squad_themes (id, name, description, icon, active) values
  ('constellations', 'Constellations', 'Stars of leadership and initiative', '🌟', true),
  ('explorers', 'Explorers', 'Pioneers who chart new paths', '🧭', true),
  ('entrepreneurship', 'Entrepreneurship', 'Builders of ventures', '🚀', true),
  ('leadership', 'Leadership', 'Teams driven by purpose and impact', '🎯', true)
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.squad_theme_items (id, theme_id, name, description, icon) values
  ('catalyst', 'entrepreneurship', 'Catalyst', 'Spark innovation', '⚡'),
  ('momentum', 'entrepreneurship', 'Momentum', 'Sustain growth', '📈'),
  ('polaris', 'constellations', 'Polaris', 'Guiding light', '⭐')
on conflict (id) do nothing;

insert into public.cohorts (name, code, is_active, onboarding_phase)
select 'SPIKE Founding Cohort', 'SPIKE-FOUNDING', true, 'suggestions_closed'
where not exists (select 1 from public.cohorts where is_active = true);

drop trigger if exists cohort_suggestions_set_updated_at on public.cohort_suggestions;
create trigger cohort_suggestions_set_updated_at before update on public.cohort_suggestions
for each row execute function public.set_updated_at();

drop trigger if exists cohort_finalists_set_updated_at on public.cohort_finalists;
create trigger cohort_finalists_set_updated_at before update on public.cohort_finalists
for each row execute function public.set_updated_at();

drop trigger if exists formation_squads_set_updated_at on public.formation_squads;
create trigger formation_squads_set_updated_at before update on public.formation_squads
for each row execute function public.set_updated_at();

alter table public.cohort_suggestions enable row level security;
alter table public.cohort_finalists enable row level security;
alter table public.cohort_votes enable row level security;
alter table public.formation_squads enable row level security;
alter table public.formation_squad_members enable row level security;
alter table public.participant_achievements enable row level security;

drop policy if exists cohorts_read on public.cohorts;
create policy cohorts_read on public.cohorts for select using (auth.uid() is not null);

drop policy if exists cohorts_staff on public.cohorts;
create policy cohorts_staff on public.cohorts for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY', 'MENTOR'))
);

drop policy if exists cohort_suggestions_own on public.cohort_suggestions;
create policy cohort_suggestions_own on public.cohort_suggestions for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists cohort_suggestions_read on public.cohort_suggestions;
create policy cohort_suggestions_read on public.cohort_suggestions for select using (auth.uid() is not null);

drop policy if exists cohort_finalists_read on public.cohort_finalists;
create policy cohort_finalists_read on public.cohort_finalists for select using (auth.uid() is not null);

drop policy if exists cohort_finalists_staff on public.cohort_finalists;
create policy cohort_finalists_staff on public.cohort_finalists for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY'))
);

drop policy if exists cohort_votes_own on public.cohort_votes;
create policy cohort_votes_own on public.cohort_votes for insert
with check (auth.uid() = participant_id);

drop policy if exists cohort_votes_read on public.cohort_votes;
create policy cohort_votes_read on public.cohort_votes for select using (auth.uid() is not null);

drop policy if exists formation_squads_read on public.formation_squads;
create policy formation_squads_read on public.formation_squads for select using (auth.uid() is not null);

drop policy if exists formation_squads_staff on public.formation_squads;
create policy formation_squads_staff on public.formation_squads for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY', 'MENTOR'))
);

drop policy if exists formation_squads_member_update on public.formation_squads;
create policy formation_squads_member_update on public.formation_squads for update using (
  exists (
    select 1 from public.formation_squad_members m
    where m.squad_id = formation_squads.id and m.participant_id = auth.uid()
  )
);

drop policy if exists formation_squad_members_read on public.formation_squad_members;
create policy formation_squad_members_read on public.formation_squad_members for select using (auth.uid() is not null);

drop policy if exists formation_squad_members_staff on public.formation_squad_members;
create policy formation_squad_members_staff on public.formation_squad_members for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN', 'FACULTY'))
);

drop policy if exists participant_achievements_own on public.participant_achievements;
create policy participant_achievements_own on public.participant_achievements for all
using (auth.uid() = participant_id) with check (auth.uid() = participant_id);
