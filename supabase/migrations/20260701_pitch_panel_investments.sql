-- Week 2 pitch panel — Venture Capital investment simulation (replaces star scoring).

create table if not exists public.pitch_panel_investments (
  id uuid primary key default gen_random_uuid(),
  session_id text not null default 'segment-1-week-2',
  panelist_token uuid not null,
  panelist_name text not null,
  panelist_org text not null default '',
  squad_name text not null,
  amount integer not null default 0 check (amount >= 0 and amount <= 1000000 and amount % 10000 = 0),
  comment text not null default '',
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, panelist_token, squad_name)
);

create table if not exists public.pitch_panel_panelist_capital (
  session_id text not null default 'segment-1-week-2',
  panelist_token uuid not null,
  panelist_name text not null,
  panelist_org text not null default '',
  available_capital integer not null default 1000000 check (available_capital = 1000000),
  allocated_capital integer not null default 0 check (allocated_capital >= 0 and allocated_capital <= 1000000),
  remaining_capital integer not null default 1000000 check (remaining_capital >= 0 and remaining_capital <= 1000000),
  is_finalized boolean not null default false,
  tie_vote_squad text,
  finalized_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, panelist_token)
);

create index if not exists pitch_panel_investments_session_squad_idx
  on public.pitch_panel_investments (session_id, squad_name);

create index if not exists pitch_panel_investments_session_panelist_idx
  on public.pitch_panel_investments (session_id, panelist_token);

alter table public.pitch_panel_investments enable row level security;
alter table public.pitch_panel_panelist_capital enable row level security;

drop policy if exists pitch_panel_investments_staff_read on public.pitch_panel_investments;
create policy pitch_panel_investments_staff_read on public.pitch_panel_investments
  for select using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

drop policy if exists pitch_panel_capital_staff_read on public.pitch_panel_panelist_capital;
create policy pitch_panel_capital_staff_read on public.pitch_panel_panelist_capital
  for select using (
    public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  );

create or replace function public._pitch_panel_session_finalized(p_session_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.pitch_panel_finalize f
    where f.session_id = coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2')
  );
$$;

create or replace function public._pitch_panel_refresh_capital(
  p_session_id text,
  p_panelist_token uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_allocated integer;
begin
  select coalesce(sum(amount), 0)::integer
  into v_allocated
  from public.pitch_panel_investments
  where session_id = v_session
    and panelist_token = p_panelist_token;

  update public.pitch_panel_panelist_capital
  set
    allocated_capital = v_allocated,
    remaining_capital = 1000000 - v_allocated,
    updated_at = now()
  where session_id = v_session
    and panelist_token = p_panelist_token;
end;
$$;

create or replace function public.submit_pitch_panel_investment(
  p_pin text,
  p_session_id text,
  p_panelist_token uuid,
  p_panelist_name text,
  p_panelist_org text,
  p_squad_name text,
  p_amount integer,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
  v_amount integer := greatest(0, coalesce(p_amount, 0));
  v_total integer;
  v_capital record;
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if public._pitch_panel_session_finalized(v_session) then
    raise exception 'Investment session is finalized';
  end if;

  if v_amount > 0 and v_amount % 10000 <> 0 then
    raise exception 'Investments must be in ₱10,000 increments';
  end if;

  if length(coalesce(trim(p_comment), '')) > 100 then
    raise exception 'Comment must be 100 characters or fewer';
  end if;

  select * into v_capital
  from public.pitch_panel_panelist_capital
  where session_id = v_session and panelist_token = p_panelist_token;

  if v_capital is not null and v_capital.is_finalized then
    raise exception 'Portfolio already finalized';
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_total
  from public.pitch_panel_investments
  where session_id = v_session
    and panelist_token = p_panelist_token
    and lower(trim(squad_name)) <> lower(trim(p_squad_name));

  if v_total + v_amount > 1000000 then
    raise exception 'Total allocation cannot exceed ₱1,000,000';
  end if;

  insert into public.pitch_panel_panelist_capital (
    session_id, panelist_token, panelist_name, panelist_org
  ) values (
    v_session, p_panelist_token, trim(p_panelist_name), coalesce(trim(p_panelist_org), '')
  )
  on conflict (session_id, panelist_token)
  do update set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    updated_at = now();

  insert into public.pitch_panel_investments (
    session_id,
    panelist_token,
    panelist_name,
    panelist_org,
    squad_name,
    amount,
    comment,
    is_final
  ) values (
    v_session,
    p_panelist_token,
    trim(p_panelist_name),
    coalesce(trim(p_panelist_org), ''),
    trim(p_squad_name),
    v_amount,
    left(coalesce(trim(p_comment), ''), 100),
    false
  )
  on conflict (session_id, panelist_token, squad_name)
  do update set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    amount = excluded.amount,
    comment = excluded.comment,
    is_final = false,
    updated_at = now();

  perform public._pitch_panel_refresh_capital(v_session, p_panelist_token);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fetch_pitch_panelist_portfolio(
  p_pin text,
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
  v_allocations jsonb;
  v_capital jsonb;
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  select coalesce(
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
  )
  into v_allocations
  from public.pitch_panel_investments i
  where i.session_id = v_session
    and i.panelist_token = p_panelist_token;

  select jsonb_build_object(
    'availableCapital', coalesce(c.available_capital, 1000000),
    'allocatedCapital', coalesce(c.allocated_capital, 0),
    'remainingCapital', coalesce(c.remaining_capital, 1000000),
    'isFinalized', coalesce(c.is_finalized, false),
    'finalizedAt', c.finalized_at,
    'tieVoteSquad', c.tie_vote_squad,
    'panelistName', c.panelist_name,
    'panelistOrg', c.panelist_org
  )
  into v_capital
  from public.pitch_panel_panelist_capital c
  where c.session_id = v_session
    and c.panelist_token = p_panelist_token;

  if v_capital is null then
    v_capital := jsonb_build_object(
      'availableCapital', 1000000,
      'allocatedCapital', 0,
      'remainingCapital', 1000000,
      'isFinalized', false,
      'finalizedAt', null,
      'tieVoteSquad', null,
      'panelistName', null,
      'panelistOrg', null
    );
  end if;

  return jsonb_build_object(
    'sessionId', v_session,
    'sessionFinalized', public._pitch_panel_session_finalized(v_session),
    'allocations', v_allocations,
    'capital', v_capital
  );
end;
$$;

create or replace function public.finalize_pitch_panelist_portfolio(
  p_pin text,
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
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if public._pitch_panel_session_finalized(v_session) then
    raise exception 'Investment session is finalized';
  end if;

  update public.pitch_panel_investments
  set is_final = true, updated_at = now()
  where session_id = v_session
    and panelist_token = p_panelist_token;

  insert into public.pitch_panel_panelist_capital (
    session_id, panelist_token, panelist_name, is_finalized, finalized_at
  )
  select v_session, p_panelist_token, coalesce(max(panelist_name), 'Panelist'), true, now()
  from public.pitch_panel_investments
  where session_id = v_session and panelist_token = p_panelist_token
  on conflict (session_id, panelist_token)
  do update set
    is_finalized = true,
    finalized_at = now(),
    updated_at = now();

  perform public._pitch_panel_refresh_capital(v_session, p_panelist_token);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_pitch_panel_tie_vote(
  p_pin text,
  p_session_id text,
  p_panelist_token uuid,
  p_squad_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := coalesce(nullif(trim(p_session_id), ''), 'segment-1-week-2');
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  update public.pitch_panel_panelist_capital
  set tie_vote_squad = trim(p_squad_name), updated_at = now()
  where session_id = v_session
    and panelist_token = p_panelist_token
    and is_finalized = true;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fetch_pitch_panel_squad_investments(
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
          'panelistName', i.panelist_name,
          'panelistOrg', i.panelist_org,
          'amount', i.amount,
          'comment', i.comment,
          'isFinal', i.is_final,
          'updatedAt', i.updated_at
        )
        order by i.amount desc, i.panelist_name
      )
      from public.pitch_panel_investments i
      where i.session_id = v_session
        and lower(trim(i.squad_name)) = lower(v_squad)
        and i.is_final = true
    ),
    '[]'::jsonb
  );
end;
$$;

-- Live + finalized state for staff dashboard
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

  return jsonb_build_object(
    'sessionId', v_session,
    'finalized', v_final is not null,
    'finalizedAt', (select finalized_at from public.pitch_panel_finalize where session_id = v_session),
    'squadResults', coalesce(v_final, '{}'::jsonb),
    'liveSquads', v_squads,
    'panelists', v_panelists,
    'tieVotes', v_tie_votes
  );
end;
$$;

grant execute on function public.submit_pitch_panel_investment(text, text, uuid, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.fetch_pitch_panelist_portfolio(text, text, uuid) to anon, authenticated;
grant execute on function public.finalize_pitch_panelist_portfolio(text, text, uuid) to anon, authenticated;
grant execute on function public.submit_pitch_panel_tie_vote(text, text, uuid, text) to anon, authenticated;
grant execute on function public.fetch_pitch_panel_squad_investments(text, text) to authenticated;
grant execute on function public.fetch_pitch_panel_state(text) to anon, authenticated;
