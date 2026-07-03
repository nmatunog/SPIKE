-- Allow staff to reopen a panelist portfolio that was finalized too early.

create or replace function public.reopen_pitch_panelist_portfolio(
  p_session_id text,
  p_panelist_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_name text;
begin
  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Only staff can reopen a panelist portfolio.';
  end if;

  if public._pitch_panel_session_finalized(v_session) then
    raise exception 'Demo Day results are locked — cannot reopen panelist portfolios.';
  end if;

  if p_panelist_token is null then
    raise exception 'Panelist token required';
  end if;

  select panelist_name into v_name
  from public.pitch_panel_panelist_capital
  where session_id = v_session
    and panelist_token = p_panelist_token;

  if v_name is null then
    select coalesce(max(panelist_name), 'Panelist') into v_name
    from public.pitch_panel_investments
    where session_id = v_session
      and panelist_token = p_panelist_token;
  end if;

  if v_name is null then
    raise exception 'Panelist not found';
  end if;

  update public.pitch_panel_panelist_capital
  set
    is_finalized = false,
    finalized_at = null,
    tie_vote_squad = null,
    updated_at = now()
  where session_id = v_session
    and panelist_token = p_panelist_token;

  if not found then
    insert into public.pitch_panel_panelist_capital (
      session_id, panelist_token, panelist_name, is_finalized
    ) values (
      v_session, p_panelist_token, v_name, false
    );
  end if;

  update public.pitch_panel_investments
  set is_final = false, updated_at = now()
  where session_id = v_session
    and panelist_token = p_panelist_token;

  perform public._pitch_panel_refresh_capital(v_session, p_panelist_token);

  return jsonb_build_object(
    'ok', true,
    'panelistName', v_name,
    'panelistToken', p_panelist_token
  );
end;
$$;

grant execute on function public.reopen_pitch_panelist_portfolio(text, uuid) to authenticated;
