-- SPIKE Sprint 04 PR4.1 — Survey response collection
-- Also extends playbook_completions item_type for surveys.
-- Run AFTER 20260621_sprint_03_playbook_completions.sql
-- Uses content slug IDs (survey-day-1-orientation), not bigint surveys table.

alter table public.playbook_completions drop constraint if exists playbook_completions_item_type_check;
alter table public.playbook_completions add constraint playbook_completions_item_type_check
  check (item_type in ('worksheet', 'activity', 'reflection', 'assessment', 'survey'));

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  survey_id text not null,
  day_id text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, survey_id)
);

create table if not exists public.survey_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id text not null,
  answer jsonb not null,
  unique (response_id, question_id)
);

create index if not exists survey_responses_user_id_idx on public.survey_responses(user_id);
create index if not exists survey_response_answers_response_id_idx on public.survey_response_answers(response_id);

drop trigger if exists survey_responses_set_updated_at on public.survey_responses;
create trigger survey_responses_set_updated_at before update on public.survey_responses
for each row execute function public.set_updated_at();

alter table public.survey_responses enable row level security;
alter table public.survey_response_answers enable row level security;

drop policy if exists survey_responses_select_own on public.survey_responses;
create policy survey_responses_select_own on public.survey_responses
for select using (auth.uid() = user_id);

drop policy if exists survey_responses_select_staff on public.survey_responses;
create policy survey_responses_select_staff on public.survey_responses
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists survey_responses_insert_own on public.survey_responses;
create policy survey_responses_insert_own on public.survey_responses
for insert with check (auth.uid() = user_id);

drop policy if exists survey_responses_update_own on public.survey_responses;
create policy survey_responses_update_own on public.survey_responses
for update using (auth.uid() = user_id);

drop policy if exists survey_response_answers_select_own on public.survey_response_answers;
create policy survey_response_answers_select_own on public.survey_response_answers
for select using (
  exists (
    select 1 from public.survey_responses r
    where r.id = response_id and r.user_id = auth.uid()
  )
);

drop policy if exists survey_response_answers_select_staff on public.survey_response_answers;
create policy survey_response_answers_select_staff on public.survey_response_answers
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN')
  )
);

drop policy if exists survey_response_answers_insert_own on public.survey_response_answers;
create policy survey_response_answers_insert_own on public.survey_response_answers
for insert with check (
  exists (
    select 1 from public.survey_responses r
    where r.id = response_id and r.user_id = auth.uid()
  )
);

drop policy if exists survey_response_answers_update_own on public.survey_response_answers;
create policy survey_response_answers_update_own on public.survey_response_answers
for update using (
  exists (
    select 1 from public.survey_responses r
    where r.id = response_id and r.user_id = auth.uid()
  )
);
