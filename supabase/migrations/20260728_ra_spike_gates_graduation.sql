-- RA-SPIKE Phase 7 — stage gates + graduation

create or replace function public.submit_ra_spike_week(p_week smallint)
returns public.ra_spike_week_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.ra_spike_week_progress;
  prog public.intern_progress;
  w smallint := greatest(1, least(8, coalesce(p_week, 1)));
begin
  if uid is null then raise exception 'Sign in required.'; end if;

  select * into row from public.ra_spike_week_progress where user_id = uid and week = w;
  if not found then raise exception 'Week progress not found.'; end if;

  if row.learn_status <> 'complete' or row.workshop_status <> 'complete'
    or row.assignment_status <> 'complete' or row.reflection_status <> 'complete' then
    raise exception 'Complete Learn, Workshop, Assignment, and Reflection before submitting.';
  end if;

  update public.ra_spike_week_progress
  set submit_status = 'complete', week_submitted_at = coalesce(week_submitted_at, now()), updated_at = now()
  where user_id = uid and week = w returning * into row;

  select * into prog from public.intern_progress where user_id = uid;
  if prog.program_slug <> 'ra-spike' then return row; end if;

  if w = 4 then
    update public.intern_progress set gate_1_status = 'pending' where user_id = uid;
    return row;
  end if;
  if w = 8 then
    update public.intern_progress set gate_2_status = 'pending' where user_id = uid;
    return row;
  end if;

  if coalesce(prog.ra_spike_current_week, 1) = w and w < 8 then
    update public.intern_progress
    set
      ra_spike_current_week = w + 1,
      ra_spike_segment = case when w + 1 >= 5 then 2 else coalesce(ra_spike_segment, 1) end
    where user_id = uid;
  end if;

  return row;
end;
$$;

create or replace function public.evaluate_ra_spike_gate(
  p_user_id uuid,
  p_gate smallint,
  p_result text
)
returns public.intern_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  prog public.intern_progress;
  passed boolean := lower(trim(p_result)) = 'passed';
  role text := public.current_role();
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;

  select * into prog from public.intern_progress where user_id = p_user_id;
  if not found or prog.program_slug <> 'ra-spike' then
    raise exception 'Not an RA-SPIKE participant.';
  end if;

  if p_gate = 1 then
    update public.intern_progress
    set
      gate_1_status = case when passed then 'passed' else 'failed' end,
      gate_1_evaluated_at = now(),
      ra_spike_segment = case when passed then 2 else coalesce(ra_spike_segment, 1) end,
      ra_spike_current_week = case when passed and coalesce(ra_spike_current_week, 4) <= 4 then 5 else ra_spike_current_week end
  where user_id = p_user_id;
  elsif p_gate = 2 then
    update public.intern_progress
    set
      gate_2_status = case when passed then 'passed' else 'failed' end,
      gate_2_evaluated_at = now(),
      graduated_at = case when passed then coalesce(graduated_at, now()) else graduated_at end
    where user_id = p_user_id;
  else
    raise exception 'Invalid gate number.';
  end if;

  select * into prog from public.intern_progress where user_id = p_user_id;
  return prog;
end;
$$;

create or replace function public.graduate_ra_spike(
  p_user_id uuid default null,
  p_transition_internship boolean default false
)
returns public.intern_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := coalesce(p_user_id, auth.uid());
  prog public.intern_progress;
  role text := public.current_role();
begin
  if uid is null then raise exception 'User required.'; end if;

  if p_user_id is not null and role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;

  update public.intern_progress
  set
    gate_2_status = 'passed',
    gate_2_evaluated_at = coalesce(gate_2_evaluated_at, now()),
    graduated_at = coalesce(graduated_at, now()),
    program_slug = case when p_transition_internship then 'spike-internship' else program_slug end
  where user_id = uid and program_slug = 'ra-spike'
  returning * into prog;

  if not found then raise exception 'Not an RA-SPIKE participant.'; end if;
  return prog;
end;
$$;

grant execute on function public.evaluate_ra_spike_gate(uuid, smallint, text) to authenticated;
grant execute on function public.graduate_ra_spike(uuid, boolean) to authenticated;
