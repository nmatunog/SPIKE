-- Mentor / advisor observation, evaluation, and debrief captures (Week 1+).

create table if not exists public.mentor_encoding_responses (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  participant_id uuid references public.profiles(id) on delete cascade,
  week integer not null default 1 check (week between 1 and 15),
  day integer not null check (day between 1 and 15),
  form_type text not null check (form_type in ('observation', 'debrief', 'evaluation')),
  template_id text not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mentor_encoding_responses_participant_uniq
  on public.mentor_encoding_responses (staff_id, participant_id, week, day, form_type)
  where participant_id is not null;

create unique index if not exists mentor_encoding_responses_cohort_uniq
  on public.mentor_encoding_responses (staff_id, week, day, form_type, template_id)
  where participant_id is null;

create index if not exists mentor_encoding_responses_staff_idx
  on public.mentor_encoding_responses (staff_id, week, day);

drop trigger if exists mentor_encoding_responses_set_updated_at on public.mentor_encoding_responses;
create trigger mentor_encoding_responses_set_updated_at
before update on public.mentor_encoding_responses
for each row execute function public.set_updated_at();

alter table public.mentor_encoding_responses enable row level security;

drop policy if exists mentor_encoding_responses_staff on public.mentor_encoding_responses;
create policy mentor_encoding_responses_staff on public.mentor_encoding_responses
for all
using (public.current_role() in ('MENTOR', 'FACULTY', 'ADMIN', 'SUPERUSER'))
with check (public.current_role() in ('MENTOR', 'FACULTY', 'ADMIN', 'SUPERUSER'));

drop policy if exists mentor_encoding_responses_participant_read on public.mentor_encoding_responses;
create policy mentor_encoding_responses_participant_read on public.mentor_encoding_responses
for select
using (auth.uid() = participant_id);
