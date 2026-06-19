-- Stage Gate Ceremony v1 — cohort unlocks, certificates, audit history.

create table if not exists public.stage_gate_unlocks (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint references public.cohorts(id) on delete cascade,
  segment integer not null default 1 check (segment between 1 and 4),
  closing_week integer not null check (closing_week between 1 and 15),
  next_week integer not null check (next_week between 1 and 15),
  stage_label text not null,
  next_stage_label text not null,
  unlocked_at timestamptz not null default now(),
  unlocked_by uuid references public.profiles(id) on delete set null,
  unique (cohort_id, segment, closing_week)
);

create table if not exists public.stage_gate_certificates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id bigint references public.cohorts(id) on delete set null,
  segment integer not null default 1,
  closing_week integer not null,
  stage text not null,
  stage_label text not null,
  title text not null,
  completed_date date not null,
  squad_name text,
  program_name text not null default 'SPIKE Venture Studio',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (participant_id, segment, closing_week)
);

create table if not exists public.stage_gate_history (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint references public.cohorts(id) on delete set null,
  coach_id uuid references public.profiles(id) on delete set null,
  segment integer not null default 1,
  closing_week integer not null,
  stage_label text not null,
  next_stage_label text not null,
  participant_count integer not null default 0,
  squad_count integer not null default 0,
  unlocked_at timestamptz not null default now()
);

create index if not exists stage_gate_certificates_participant_idx
  on public.stage_gate_certificates (participant_id, closing_week desc);

alter table public.stage_gate_unlocks enable row level security;
alter table public.stage_gate_certificates enable row level security;
alter table public.stage_gate_history enable row level security;

drop policy if exists stage_gate_unlocks_staff_read on public.stage_gate_unlocks;
create policy stage_gate_unlocks_staff_read on public.stage_gate_unlocks
  for select using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

drop policy if exists stage_gate_certificates_read on public.stage_gate_certificates;
create policy stage_gate_certificates_read on public.stage_gate_certificates
  for select using (
    participant_id = auth.uid()
    or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

drop policy if exists stage_gate_history_staff_read on public.stage_gate_history;
create policy stage_gate_history_staff_read on public.stage_gate_history
  for select using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

-- Staff unlock: advance cohort to next week, record unlock + history.
create or replace function public.unlock_cohort_stage(
  p_closing_week integer,
  p_segment integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_cohort_id bigint;
  v_gate record;
  v_next_week integer;
  v_participant_count integer;
  v_squad_count integer;
begin
  v_role := public.current_role();
  if v_role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Only staff can unlock a stage gate.';
  end if;

  select id into v_cohort_id
  from public.cohorts
  where is_active = true
  order by id asc
  limit 1;

  if v_cohort_id is null then
    select id into v_cohort_id from public.cohorts order by id asc limit 1;
  end if;

  v_next_week := least(15, p_closing_week + 1);

  insert into public.stage_gate_unlocks (
    cohort_id, segment, closing_week, next_week,
    stage_label, next_stage_label, unlocked_by
  )
  values (
    v_cohort_id, p_segment, p_closing_week, v_next_week,
    case p_closing_week
      when 1 then 'DISCOVER'
      when 2 then 'VALIDATE'
      when 4 then 'BUILD'
      else 'STAGE'
    end,
    case v_next_week
      when 2 then 'VALIDATE'
      when 3 then 'BUILD'
      when 5 then 'PITCH'
      else 'NEXT'
    end,
    auth.uid()
  )
  on conflict (cohort_id, segment, closing_week) do update
  set
    next_week = excluded.next_week,
    unlocked_at = now(),
    unlocked_by = auth.uid();

  update public.intern_progress
  set
    current_week = v_next_week,
    current_day = 1
  where cohort_id = v_cohort_id or (cohort_id is null and v_cohort_id is not null);

  select count(*)::integer into v_participant_count
  from public.intern_progress ip
  where ip.cohort_id = v_cohort_id or v_cohort_id is null;

  select count(distinct squad)::integer into v_squad_count
  from public.intern_progress ip
  where (ip.cohort_id = v_cohort_id or v_cohort_id is null)
    and ip.squad is not null
    and trim(ip.squad) <> '';

  insert into public.stage_gate_history (
    cohort_id, coach_id, segment, closing_week,
    stage_label, next_stage_label, participant_count, squad_count
  )
  values (
    v_cohort_id, auth.uid(), p_segment, p_closing_week,
    case p_closing_week when 1 then 'DISCOVER' when 2 then 'VALIDATE' when 4 then 'BUILD' else 'STAGE' end,
    case v_next_week when 2 then 'VALIDATE' when 3 then 'BUILD' when 5 then 'PITCH' else 'NEXT' end,
    v_participant_count, v_squad_count
  );

  return jsonb_build_object(
    'ok', true,
    'cohortId', v_cohort_id,
    'closingWeek', p_closing_week,
    'nextWeek', v_next_week,
    'participantCount', v_participant_count
  );
end;
$$;

grant execute on function public.unlock_cohort_stage(integer, integer) to authenticated;

notify pgrst, 'reload schema';
