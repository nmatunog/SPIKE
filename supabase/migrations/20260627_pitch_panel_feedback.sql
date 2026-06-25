-- Pitch panel — Keep / Improve / Explore feedback on score cards.

alter table public.pitch_panel_scores
  add column if not exists keep_feedback text not null default '',
  add column if not exists improve_feedback text not null default '',
  add column if not exists explore_feedback text not null default '';

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
  p_team integer,
  p_keep_feedback text default '',
  p_improve_feedback text default '',
  p_explore_feedback text default ''
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

  if length(trim(coalesce(p_keep_feedback, ''))) < 3
    or length(trim(coalesce(p_improve_feedback, ''))) < 3
    or length(trim(coalesce(p_explore_feedback, ''))) < 3 then
    raise exception 'Keep, Improve, and Explore feedback are required';
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
    team,
    keep_feedback,
    improve_feedback,
    explore_feedback
  ) values (
    coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2'),
    trim(p_squad_name),
    trim(p_panelist_name),
    coalesce(trim(p_panelist_org), ''),
    p_panelist_token,
    p_evidence,
    p_validation,
    p_presentation,
    p_team,
    trim(p_keep_feedback),
    trim(p_improve_feedback),
    trim(p_explore_feedback)
  )
  on conflict (session_id, squad_name, panelist_token)
  do update set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    evidence = excluded.evidence,
    validation = excluded.validation,
    presentation = excluded.presentation,
    team = excluded.team,
    keep_feedback = excluded.keep_feedback,
    improve_feedback = excluded.improve_feedback,
    explore_feedback = excluded.explore_feedback,
    submitted_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fetch_pitch_panel_squad_feedback(
  p_squad_name text,
  p_session_id text default 'segment-1-week-2'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_squad text := trim(p_squad_name);
  v_allowed boolean := false;
begin
  if v_squad = '' then
    raise exception 'Squad name required';
  end if;

  v_allowed := public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
    or exists (
      select 1
      from public.formation_squad_members m
      join public.formation_squads s on s.id = m.squad_id
      where lower(trim(s.name)) = lower(v_squad)
        and m.participant_id = auth.uid()
    );

  if not v_allowed then
    raise exception 'Not authorized for this squad';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'panelistName', s.panelist_name,
          'panelistOrg', s.panelist_org,
          'evidence', s.evidence,
          'validation', s.validation,
          'presentation', s.presentation,
          'team', s.team,
          'keepFeedback', s.keep_feedback,
          'improveFeedback', s.improve_feedback,
          'exploreFeedback', s.explore_feedback,
          'submittedAt', s.submitted_at
        )
        order by s.submitted_at asc
      )
      from public.pitch_panel_scores s
      where s.session_id = v_session
        and lower(trim(s.squad_name)) = lower(v_squad)
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.submit_pitch_panel_score(
  text, text, uuid, text, text, text, integer, integer, integer, integer, text, text, text
) to anon, authenticated;

grant execute on function public.fetch_pitch_panel_squad_feedback(text, text) to authenticated;
