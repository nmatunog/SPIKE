-- Unified venture document — single squad-scoped object for identity, research, FEC, pitch, and stage.
-- Complements (does not replace) canvas_summary, venture_blueprint_entries, and local studio stores.

create table if not exists public.ventures (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid references public.formation_squads(id) on delete set null,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  schema_version text not null default '1' check (schema_version in ('1')),
  identity jsonb not null default '{}'::jsonb,
  research jsonb not null default '{}'::jsonb,
  fec jsonb not null default '{}'::jsonb,
  pitch jsonb not null default '{}'::jsonb,
  stage jsonb not null default '{}'::jsonb,
  compiled_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ventures_squad_id_unique
  on public.ventures (squad_id)
  where squad_id is not null;

create unique index if not exists ventures_owner_solo_unique
  on public.ventures (owner_user_id)
  where squad_id is null;

create index if not exists ventures_owner_user_id_idx on public.ventures (owner_user_id);

comment on table public.ventures is
  'Canonical venture object per squad (or solo intern draft before squad assignment).';

comment on column public.ventures.identity is
  'squadName, ventureName, tagline, vision';

comment on column public.ventures.research is
  'customerSegment, insights[], evidence[], opportunityStatement, ventureOpportunity';

comment on column public.ventures.fec is
  'uniqueVentureProposition, clientExperience, growthEngine, financialEngine, roadmap';

comment on column public.ventures.pitch is
  'story, speakerAssignments[], presentationDeck, readinessScore';

comment on column public.ventures.stage is
  'currentWeek, completedMilestones[], unlockedModules[]';

comment on column public.ventures.compiled_snapshot is
  'Last merged view from legacy tables (canvas_summary, blueprint entries, studio local) for audit/diff.';

drop trigger if exists ventures_set_updated_at on public.ventures;
create trigger ventures_set_updated_at
before update on public.ventures
for each row execute function public.set_updated_at();

alter table public.ventures enable row level security;

drop policy if exists ventures_staff_read on public.ventures;
create policy ventures_staff_read on public.ventures
for select
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));

drop policy if exists ventures_member_read on public.ventures;
create policy ventures_member_read on public.ventures
for select
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.formation_squad_members m
    where m.squad_id = ventures.squad_id
      and m.participant_id = auth.uid()
  )
);

drop policy if exists ventures_member_write on public.ventures;
create policy ventures_member_write on public.ventures
for all
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.formation_squad_members m
    where m.squad_id = ventures.squad_id
      and m.participant_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.formation_squad_members m
    where m.squad_id = ventures.squad_id
      and m.participant_id = auth.uid()
  )
);
