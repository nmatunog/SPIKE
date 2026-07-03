-- Coach matrix: same access model as fetch_pitch_panel_state (anon + authenticated).
-- Include panelists from investments even when capital row is missing.

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
        'panelistToken', p.panelist_token,
        'panelistName', coalesce(c.panelist_name, p.panelist_name, 'Panelist'),
        'panelistOrg', coalesce(c.panelist_org, p.panelist_org, ''),
        'isFinalized', coalesce(c.is_finalized, false),
        'finalizedAt', c.finalized_at,
        'allocatedCapital', coalesce(c.allocated_capital, p.allocated_total, 0),
        'remainingCapital', coalesce(c.remaining_capital, 1000000 - coalesce(p.allocated_total, 0)),
        'allocations', coalesce(p.allocations, '[]'::jsonb)
      )
      order by coalesce(c.panelist_name, p.panelist_name, 'Panelist')
    ),
    '[]'::jsonb
  )
  into v_panelists
  from (
    select
      i.panelist_token,
      max(i.panelist_name) as panelist_name,
      max(i.panelist_org) as panelist_org,
      sum(i.amount)::integer as allocated_total,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'squadName', i.squad_name,
            'amount', i.amount,
            'comment', i.comment,
            'isFinal', i.is_final,
            'updatedAt', i.updated_at
          )
          order by i.squad_name
        ),
        '[]'::jsonb
      ) as allocations
    from public.pitch_panel_investments i
    where i.session_id = v_session
    group by i.panelist_token
  ) p
  left join public.pitch_panel_panelist_capital c
    on c.session_id = v_session
    and c.panelist_token = p.panelist_token;

  return jsonb_build_object(
    'sessionId', v_session,
    'sessionFinalized', public._pitch_panel_session_finalized(v_session),
    'squads', v_squads,
    'panelists', v_panelists
  );
end;
$$;

grant execute on function public.fetch_pitch_panel_coach_matrix(text) to anon, authenticated;

-- Embed coach matrix in live state sync (no extra round-trip for dashboard).
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
  v_panelists jsonb := '[]'::jsonb;
  v_tie_votes jsonb := '{}'::jsonb;
  v_coach_matrix jsonb;
begin
  select f.squad_results into v_final
  from public.pitch_panel_finalize f
  where f.session_id = v_session;

  select coalesce(
    jsonb_object_agg(
      squad_name,
      jsonb_build_object(
        'totalInvestment', total_investment,
        'provisionalInvestment', provisional_investment,
        'finalInvestment', final_investment,
        'investorCount', investor_count,
        'finalizedInvestorCount', finalized_investor_count
      )
    ),
    '{}'::jsonb
  )
  into v_squads
  from (
    select
      i.squad_name,
      sum(i.amount)::integer as total_investment,
      sum(case when not i.is_final then i.amount else 0 end)::integer as provisional_investment,
      sum(case when i.is_final then i.amount else 0 end)::integer as final_investment,
      count(distinct i.panelist_token)::integer as investor_count,
      count(distinct case when i.is_final then i.panelist_token end)::integer as finalized_investor_count
    from public.pitch_panel_investments i
    where i.session_id = v_session
    group by i.squad_name
  ) agg;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'panelistToken', c.panelist_token,
        'panelistName', c.panelist_name,
        'panelistOrg', c.panelist_org,
        'allocatedCapital', c.allocated_capital,
        'remainingCapital', c.remaining_capital,
        'isFinalized', c.is_finalized,
        'finalizedAt', c.finalized_at,
        'tieVoteSquad', c.tie_vote_squad
      )
      order by c.panelist_name
    ),
    '[]'::jsonb
  )
  into v_panelists
  from public.pitch_panel_panelist_capital c
  where c.session_id = v_session;

  select coalesce(
    jsonb_object_agg(lower(trim(tie_vote_squad)), vote_count),
    '{}'::jsonb
  )
  into v_tie_votes
  from (
    select tie_vote_squad, count(*)::integer as vote_count
    from public.pitch_panel_panelist_capital
    where session_id = v_session
      and tie_vote_squad is not null
      and trim(tie_vote_squad) <> ''
    group by tie_vote_squad
  ) votes;

  v_coach_matrix := public.fetch_pitch_panel_coach_matrix(v_session);

  return jsonb_build_object(
    'sessionId', v_session,
    'finalized', v_final is not null,
    'finalizedAt', (select finalized_at from public.pitch_panel_finalize where session_id = v_session),
    'squadResults', coalesce(v_final, '{}'::jsonb),
    'liveSquads', v_squads,
    'panelists', v_panelists,
    'tieVotes', v_tie_votes,
    'coachMatrix', v_coach_matrix
  );
end;
$$;

grant execute on function public.fetch_pitch_panel_state(text) to anon, authenticated;
