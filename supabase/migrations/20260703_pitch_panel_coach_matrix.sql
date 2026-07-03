-- Coach review matrix — all panelist investments (provisional + finalized) for staff.

create or replace function public.fetch_pitch_panel_coach_matrix(p_session_id text default 'segment-1-week-2')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_panelists jsonb;
  v_squads jsonb;
begin
  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required';
  end if;

  select coalesce(
    jsonb_agg(distinct i.squad_name order by i.squad_name),
    '[]'::jsonb
  )
  into v_squads
  from public.pitch_panel_investments i
  where i.session_id = v_session;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'panelistToken', c.panelist_token,
        'panelistName', c.panelist_name,
        'panelistOrg', c.panelist_org,
        'isFinalized', c.is_finalized,
        'finalizedAt', c.finalized_at,
        'allocatedCapital', c.allocated_capital,
        'remainingCapital', c.remaining_capital,
        'allocations', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'squadName', i.squad_name,
                'amount', i.amount,
                'comment', i.comment,
                'isFinal', i.is_final,
                'updatedAt', i.updated_at
              )
              order by i.squad_name
            )
            from public.pitch_panel_investments i
            where i.session_id = v_session
              and i.panelist_token = c.panelist_token
          ),
          '[]'::jsonb
        )
      )
      order by c.panelist_name
    ),
    '[]'::jsonb
  )
  into v_panelists
  from public.pitch_panel_panelist_capital c
  where c.session_id = v_session;

  return jsonb_build_object(
    'sessionId', v_session,
    'sessionFinalized', public._pitch_panel_session_finalized(v_session),
    'squads', v_squads,
    'panelists', v_panelists
  );
end;
$$;

grant execute on function public.fetch_pitch_panel_coach_matrix(text) to authenticated;
