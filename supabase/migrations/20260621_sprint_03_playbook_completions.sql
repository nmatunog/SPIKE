-- SPIKE Sprint 03 — Playbook participant progress (PR4)
-- Run AFTER 20260620_sprint_02_instructional_architecture.sql
-- Idempotent: safe to re-run.

create table if not exists public.playbook_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('worksheet', 'activity', 'reflection', 'assessment')),
  item_id text not null,
  day_id text,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create index if not exists playbook_completions_user_id_idx on public.playbook_completions(user_id);
create index if not exists playbook_completions_day_id_idx on public.playbook_completions(day_id);

drop trigger if exists playbook_completions_set_updated_at on public.playbook_completions;
create trigger playbook_completions_set_updated_at before update on public.playbook_completions
for each row execute function public.set_updated_at();

alter table public.playbook_completions enable row level security;

drop policy if exists playbook_completions_select_own on public.playbook_completions;
create policy playbook_completions_select_own on public.playbook_completions
for select using (auth.uid() = user_id);

drop policy if exists playbook_completions_select_staff on public.playbook_completions;
create policy playbook_completions_select_staff on public.playbook_completions
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists playbook_completions_insert_own on public.playbook_completions;
create policy playbook_completions_insert_own on public.playbook_completions
for insert with check (auth.uid() = user_id);

drop policy if exists playbook_completions_update_own on public.playbook_completions;
create policy playbook_completions_update_own on public.playbook_completions
for update using (auth.uid() = user_id);
