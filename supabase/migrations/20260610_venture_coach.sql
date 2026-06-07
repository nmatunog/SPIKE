-- AI Venture Coach™ — ambition, purpose, values, future self (Sprint Venture Coach v1)

create table if not exists public.ambition_profiles (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references auth.users(id) on delete cascade,
  selected_motivators jsonb default '[]'::jsonb,
  follow_up_answers jsonb default '{}'::jsonb,
  draft_versions jsonb default '[]'::jsonb,
  final_ambition text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(participant_id)
);

create table if not exists public.participant_values (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references auth.users(id) on delete cascade,
  selected_values jsonb default '[]'::jsonb,
  top_five jsonb default '[]'::jsonb,
  values_profile text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(participant_id)
);

create table if not exists public.venture_coach_progress (
  participant_id uuid primary key references auth.users(id) on delete cascade,
  purpose_text text,
  future_self_narrative text,
  career_track_interest text,
  badges jsonb default '[]'::jsonb,
  section_payload jsonb default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.ambition_profiles enable row level security;
alter table public.participant_values enable row level security;
alter table public.venture_coach_progress enable row level security;
