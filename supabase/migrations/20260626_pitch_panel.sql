-- Week 2 pitch panel — guest scores + faculty finalize (PIN: W2PITCH).

create table if not exists public.pitch_panel_scores (
  id uuid primary key default gen_random_uuid(),
  session_id text not null default 'segment-1-week-2',
  squad_name text not null,
  panelist_name text not null,
  panelist_org text not null default '',
  panelist_token uuid not null,
  evidence smallint not null check (evidence between 1 and 5),
  validation smallint not null check (validation between 1 and 5),
  presentation smallint not null check (presentation between 1 and 5),
  team smallint not null check (team between 1 and 5),
  submitted_at timestamptz not null default now(),
  unique (session_id, squad_name, panelist_token)
);

create table if not exists public.pitch_panel_finalize (
  session_id text primary key,
  finalized_at timestamptz not null default now(),
  finalized_by uuid references public.profiles(id) on delete set null,
  squad_results jsonb not null default '{}'::jsonb
);

create index if not exists pitch_panel_scores_session_idx
  on public.pitch_panel_scores (session_id, squad_name);

alter table public.pitch_panel_scores enable row level security;
alter table public.pitch_panel_finalize enable row level security;

drop policy if exists pitch_panel_scores_staff_read on public.pitch_panel_scores;
create policy pitch_panel_scores_staff_read on public.pitch_panel_scores
  for select using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

drop policy if exists pitch_panel_finalize_read on public.pitch_panel_finalize;
create policy pitch_panel_finalize_read on public.pitch_panel_finalize
  for select using (true);

drop policy if exists pitch_panel_finalize_staff_write on public.pitch_panel_finalize;
create policy pitch_panel_finalize_staff_write on public.pitch_panel_finalize
  for all using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  )
  with check (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

create or replace function public._pitch_panel_pin_ok(p_pin text)
returns boolean
language sql
immutable
as $$
  select upper(trim(coalesce(p_pin, ''))) = 'W2PITCH';
$$;

create or replace function public.submit_pitch_panel_score(
  p_pin text,
  p_session_id text,
  p_panelist_token uuid,
  p_panelist_name text,
  p_panelist_org text,
  p_squad_name text,
  p_evidence integer,
  p_validation integer,
  p_presentation integer,
  p_team integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if exists (
    select 1 from public.pitch_panel_finalize f
    where f.session_id = coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2')
  ) then
    raise exception 'Panel scoring is finalized';
  end if;

  insert into public.pitch_panel_scores (
    session_id,
    squad_name,
    panelist_name,
    panelist_org,
    panelist_token,
    evidence,
    validation,
    presentation,
    team
  ) values (
    coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2'),
    trim(p_squad_name),
    trim(p_panelist_name),
    coalesce(trim(p_panelist_org), ''),
    p_panelist_token,
    p_evidence,
    p_validation,
    p_presentation,
    p_team
  )
  on conflict (session_id, squad_name, panelist_token)
  do update set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    evidence = excluded.evidence,
    validation = excluded.validation,
    presentation = excluded.presentation,
    team = excluded.team,
    submitted_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fetch_pitch_panel_state(p_session_id text default 'segment-1-week-2')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_final jsonb;
  v_squads jsonb := '{}'::jsonb;
begin
  select f.squad_results into v_final
  from public.pitch_panel_finalize f
  where f.session_id = v_session;

  select coalesce(
    jsonb_object_agg(
      squad_name,
      jsonb_build_object(
        'panelAverage', round(avg_score::numeric, 2),
        'scoreCount', score_count,
        'panelistCount', panelist_count
      )
    ),
    '{}'::jsonb
  )
  into v_squads
  from (
    select
      s.squad_name,
      avg((s.evidence + s.validation + s.presentation + s.team) / 4.0) as avg_score,
      count(*)::integer as score_count,
      count(distinct s.panelist_token)::integer as panelist_count
    from public.pitch_panel_scores s
    where s.session_id = v_session
    group by s.squad_name
  ) agg;

  return jsonb_build_object(
    'sessionId', v_session,
    'finalized', v_final is not null,
    'finalizedAt', (select finalized_at from public.pitch_panel_finalize where session_id = v_session),
    'squadResults', coalesce(v_final, '{}'::jsonb),
    'liveSquads', v_squads
  );
end;
$$;

create or replace function public.fetch_pitch_panel_squads(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_names text[];
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  select array_agg(distinct fs.name order by
    case lower(trim(fs.name))
      when 'cassiopeia' then 1
      when 'pegasus' then 2
      when 'argo navis' then 3
      else 99
    end,
    fs.name)
  into v_names
  from public.formation_squads fs
  join public.cohorts c on c.id = fs.cohort_id and c.is_active = true;

  if v_names is null or array_length(v_names, 1) is null then
    v_names := array['Cassiopeia', 'Pegasus', 'Argo Navis'];
  end if;

  return jsonb_build_object('squads', to_jsonb(v_names));
end;
$$;

create or replace function public.finalize_pitch_panel(
  p_session_id text,
  p_squad_results jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
begin
  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required';
  end if;

  insert into public.pitch_panel_finalize (session_id, finalized_by, squad_results)
  values (v_session, auth.uid(), coalesce(p_squad_results, '{}'::jsonb))
  on conflict (session_id)
  do update set
    finalized_at = now(),
    finalized_by = auth.uid(),
    squad_results = excluded.squad_results;

  return jsonb_build_object('ok', true, 'sessionId', v_session);
end;
$$;

grant execute on function public.submit_pitch_panel_score(text, text, uuid, text, text, text, integer, integer, integer, integer) to anon, authenticated;
grant execute on function public.fetch_pitch_panel_state(text) to anon, authenticated;
grant execute on function public.fetch_pitch_panel_squads(text) to anon, authenticated;
grant execute on function public.finalize_pitch_panel(text, jsonb) to authenticated;
