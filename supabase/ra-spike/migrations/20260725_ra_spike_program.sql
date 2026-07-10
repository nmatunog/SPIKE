-- RA-SPIKE Phase 0 — program enrollment dimension
-- Idempotent: safe to re-run.

insert into public.programs (slug, title, description)
values
  ('ra-spike', 'RA-SPIKE', 'Rookie Academy – SPIKE Edition'),
  ('spike-internship', 'SPIKE Internship', 'SPIKE Venture Studio'),
  ('agency-training', 'Agency Training', 'Agency training program'),
  ('leader-academy', 'Leader Academy', 'Leader Academy program')
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

alter table public.cohorts
  add column if not exists program_slug text default 'spike-internship';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cohorts_program_slug_fkey'
  ) then
    alter table public.cohorts
      add constraint cohorts_program_slug_fkey
      foreign key (program_slug) references public.programs(slug);
  end if;
end$$;

alter table public.intern_progress
  add column if not exists program_slug text default 'spike-internship',
  add column if not exists ra_spike_segment smallint default 1,
  add column if not exists ra_spike_current_week smallint default 1,
  add column if not exists gate_1_status text,
  add column if not exists gate_1_score numeric,
  add column if not exists gate_1_evaluated_at timestamptz,
  add column if not exists gate_2_status text,
  add column if not exists gate_2_score numeric,
  add column if not exists gate_2_evaluated_at timestamptz,
  add column if not exists graduated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'intern_progress_program_slug_fkey'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_program_slug_fkey
      foreign key (program_slug) references public.programs(slug);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'intern_progress_ra_spike_segment_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_ra_spike_segment_check
      check (ra_spike_segment is null or ra_spike_segment between 1 and 2);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'intern_progress_ra_spike_current_week_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_ra_spike_current_week_check
      check (ra_spike_current_week is null or ra_spike_current_week between 1 and 8);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'intern_progress_gate_1_status_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_gate_1_status_check
      check (gate_1_status is null or gate_1_status in ('pending', 'passed', 'failed'));
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'intern_progress_gate_2_status_check'
  ) then
    alter table public.intern_progress
      add constraint intern_progress_gate_2_status_check
      check (gate_2_status is null or gate_2_status in ('pending', 'passed', 'failed'));
  end if;
end$$;

update public.intern_progress ip
set program_slug = coalesce(c.program_slug, 'spike-internship')
from public.cohorts c
where ip.cohort_id = c.id
  and coalesce(ip.program_slug, 'spike-internship') = 'spike-internship'
  and c.program_slug is not null
  and c.program_slug <> 'spike-internship';

create or replace function public.ensure_intern_progress(
  p_user_id uuid default null,
  p_university text default null,
  p_squad text default null
)
returns public.intern_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  active_cohort_id bigint;
  cohort_program text;
  row public.intern_progress;
begin
  uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );

  if uid is null then
    raise exception 'Not authenticated.';
  end if;

  if p_user_id is not null and p_user_id <> uid then
    raise exception 'User mismatch';
  end if;

  select c.id, coalesce(c.program_slug, 'spike-internship')
  into active_cohort_id, cohort_program
  from public.cohorts c
  where c.is_active = true
  order by c.id
  limit 1;

  if active_cohort_id is null then
    select c.id, coalesce(c.program_slug, 'spike-internship')
    into active_cohort_id, cohort_program
    from public.cohorts c
    order by c.id
    limit 1;
  end if;

  cohort_program := coalesce(cohort_program, 'spike-internship');

  insert into public.intern_progress (user_id, cohort_id, university, squad, program_slug)
  values (uid, active_cohort_id, nullif(trim(p_university), ''), nullif(trim(p_squad), ''), cohort_program)
  on conflict (user_id) do update
  set
    cohort_id = coalesce(public.intern_progress.cohort_id, excluded.cohort_id),
    university = coalesce(nullif(trim(excluded.university), ''), public.intern_progress.university),
    squad = coalesce(nullif(trim(excluded.squad), ''), public.intern_progress.squad),
    program_slug = coalesce(public.intern_progress.program_slug, excluded.program_slug)
  returning * into row;

  return row;
end;
$$;

grant execute on function public.ensure_intern_progress(uuid, text, text) to authenticated;
