-- Pitch panel coaching notes: default blank/short feedback to 'none' (3+ chars to keep as written).

drop function if exists public.submit_pitch_panel_score(
  text, text, uuid, text, text, text, integer, integer, integer, integer
);

create or replace function public._pitch_panel_feedback_norm(p_text text)
returns text
language sql
immutable
as $$
  select case
    when length(trim(coalesce(p_text, ''))) >= 3 then trim(p_text)
    else 'none'
  end;
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
    public._pitch_panel_feedback_norm(p_keep_feedback),
    public._pitch_panel_feedback_norm(p_improve_feedback),
    public._pitch_panel_feedback_norm(p_explore_feedback)
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

grant execute on function public.submit_pitch_panel_score(
  text, text, uuid, text, text, text, integer, integer, integer, integer, text, text, text
) to anon, authenticated;

NOTIFY pgrst, 'reload schema';
