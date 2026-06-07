-- SPIKE Sprint 05C — Executive Canvas Summary
-- Run AFTER 20260625_sprint_05_blueprint_integration.sql

create table if not exists public.canvas_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strategy_statement text not null default '',
  strategy_is_auto boolean not null default true,
  priority_1 text not null default '',
  priority_2 text not null default '',
  priority_3 text not null default '',
  year1_goal text not null default '',
  year2_goal text not null default '',
  year3_goal text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists canvas_summary_user_idx on public.canvas_summary(user_id);

drop trigger if exists canvas_summary_set_updated_at on public.canvas_summary;
create trigger canvas_summary_set_updated_at before update on public.canvas_summary
for each row execute function public.set_updated_at();

alter table public.canvas_summary enable row level security;

drop policy if exists canvas_summary_select_own on public.canvas_summary;
create policy canvas_summary_select_own on public.canvas_summary
for select using (auth.uid() = user_id);

drop policy if exists canvas_summary_select_staff on public.canvas_summary;
create policy canvas_summary_select_staff on public.canvas_summary
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists canvas_summary_insert_own on public.canvas_summary;
create policy canvas_summary_insert_own on public.canvas_summary
for insert with check (auth.uid() = user_id);

drop policy if exists canvas_summary_update_own on public.canvas_summary;
create policy canvas_summary_update_own on public.canvas_summary
for update using (auth.uid() = user_id);
