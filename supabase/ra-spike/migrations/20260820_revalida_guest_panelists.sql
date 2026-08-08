-- RA-SPIKE Revalida — guest panelists (no portal login) + check-in

alter table public.revalida_panel_ratings
  alter column panelist_id drop not null;

alter table public.revalida_panel_ratings
  add column if not exists panelist_token uuid,
  add column if not exists panelist_name text not null default '',
  add column if not exists panelist_org text not null default '';

alter table public.revalida_panel_ratings
  drop constraint if exists revalida_panel_ratings_panelist_id_squad_id_key;

create unique index if not exists revalida_panel_ratings_staff_squad_uidx
  on public.revalida_panel_ratings (panelist_id, squad_id)
  where panelist_id is not null;

create unique index if not exists revalida_panel_ratings_guest_squad_uidx
  on public.revalida_panel_ratings (panelist_token, squad_id)
  where panelist_token is not null;

alter table public.revalida_panel_ratings
  drop constraint if exists revalida_panel_ratings_panelist_identity_chk;

alter table public.revalida_panel_ratings
  add constraint revalida_panel_ratings_panelist_identity_chk
  check (panelist_id is not null or panelist_token is not null);

create index if not exists revalida_panel_ratings_token_idx
  on public.revalida_panel_ratings (panelist_token);

-- ------------------------------
-- Panelist check-in (name capture at door)
-- ------------------------------
create table if not exists public.revalida_panelist_checkins (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint not null references public.cohorts(id) on delete cascade,
  panelist_token uuid not null,
  panelist_name text not null,
  panelist_org text not null default '',
  checked_in_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, panelist_token)
);

create index if not exists revalida_panelist_checkins_cohort_idx
  on public.revalida_panelist_checkins (cohort_id, checked_in_at desc);

drop trigger if exists revalida_panelist_checkins_set_updated_at on public.revalida_panelist_checkins;
create trigger revalida_panelist_checkins_set_updated_at
before update on public.revalida_panelist_checkins
for each row execute function public.set_updated_at();

alter table public.revalida_panelist_checkins enable row level security;

drop policy if exists revalida_panelist_checkins_staff_read on public.revalida_panelist_checkins;
create policy revalida_panelist_checkins_staff_read on public.revalida_panelist_checkins
for select using (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
);

-- ------------------------------
-- Guest PIN + RPCs (anon)
-- ------------------------------
create or replace function public._revalida_pin_ok(p_pin text)
returns boolean
language sql
immutable
as $$
  select coalesce(trim(p_pin), '') = 'REVALIDA';
$$;

create or replace function public.fetch_revalida_cohorts(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'code', c.code
    ) order by c.created_at desc)
    from public.cohorts c
    where c.is_active = true
  ), '[]'::jsonb);
end;
$$;

create or replace function public.fetch_revalida_squads(p_pin text, p_cohort_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'cohort_id', s.cohort_id
    ) order by s.name)
    from public.formation_squads s
    where s.cohort_id = p_cohort_id
      and s.status = 'active'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.fetch_revalida_squad_members(p_pin text, p_squad_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'participant_id', m.participant_id,
      'role', m.role,
      'name', coalesce(p.name, 'Unknown')
    ) order by m.role, p.name)
    from public.formation_squad_members m
    left join public.profiles p on p.id = m.participant_id
    where m.squad_id = p_squad_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.revalida_panelist_check_in(
  p_pin text,
  p_panelist_token uuid,
  p_panelist_name text,
  p_panelist_org text default '',
  p_cohort_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_panelist_name, ''));
  v_org text := trim(coalesce(p_panelist_org, ''));
  v_cohort bigint;
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if v_name = '' then
    raise exception 'Panelist name is required';
  end if;

  if p_cohort_id is null then
    select c.id into v_cohort
    from public.cohorts c
    where c.is_active = true
    order by c.created_at desc
    limit 1;
  else
    v_cohort := p_cohort_id;
  end if;

  if v_cohort is null then
    raise exception 'No active cohort found';
  end if;

  insert into public.revalida_panelist_checkins (
    cohort_id,
    panelist_token,
    panelist_name,
    panelist_org
  ) values (
    v_cohort,
    p_panelist_token,
    v_name,
    v_org
  )
  on conflict (cohort_id, panelist_token) do update
  set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'cohort_id', v_cohort,
    'panelist_name', v_name,
    'panelist_org', v_org
  );
end;
$$;

create or replace function public.fetch_revalida_guest_rating(
  p_pin text,
  p_panelist_token uuid,
  p_squad_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.revalida_panel_ratings%rowtype;
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  select * into v_row
  from public.revalida_panel_ratings r
  where r.panelist_token = p_panelist_token
    and r.squad_id = p_squad_id
  limit 1;

  if not found then
    return null;
  end if;

  return to_jsonb(v_row);
end;
$$;

create or replace function public.submit_revalida_guest_rating(
  p_pin text,
  p_panelist_token uuid,
  p_panelist_name text,
  p_panelist_org text,
  p_cohort_id bigint,
  p_squad_id uuid,
  p_fvp_score numeric,
  p_business_model_score numeric,
  p_strategy_score numeric,
  p_presentation_score numeric,
  p_investment_score numeric,
  p_greatest_strength text,
  p_improvement text,
  p_recommendation text,
  p_standout_participant_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_panelist_name, ''));
  v_org text := trim(coalesce(p_panelist_org, ''));
  v_row public.revalida_panel_ratings%rowtype;
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if v_name = '' then
    raise exception 'Panelist name is required';
  end if;

  if p_recommendation not in ('ready', 'ready_with_revisions', 'needs_development') then
    raise exception 'Invalid recommendation';
  end if;

  insert into public.revalida_panel_ratings (
    panelist_id,
    panelist_token,
    panelist_name,
    panelist_org,
    cohort_id,
    squad_id,
    fvp_score,
    business_model_score,
    strategy_score,
    presentation_score,
    investment_score,
    greatest_strength,
    improvement,
    recommendation,
    standout_participant_id
  ) values (
    null,
    p_panelist_token,
    v_name,
    v_org,
    p_cohort_id,
    p_squad_id,
    p_fvp_score,
    p_business_model_score,
    p_strategy_score,
    p_presentation_score,
    p_investment_score,
    trim(coalesce(p_greatest_strength, '')),
    trim(coalesce(p_improvement, '')),
    p_recommendation,
    p_standout_participant_id
  )
  on conflict (panelist_token, squad_id) do update
  set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    fvp_score = excluded.fvp_score,
    business_model_score = excluded.business_model_score,
    strategy_score = excluded.strategy_score,
    presentation_score = excluded.presentation_score,
    investment_score = excluded.investment_score,
    greatest_strength = excluded.greatest_strength,
    improvement = excluded.improvement,
    recommendation = excluded.recommendation,
    standout_participant_id = excluded.standout_participant_id,
    updated_at = now()
  where revalida_panel_ratings.finalized = false
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.revalida_panel_ratings r
    where r.panelist_token = p_panelist_token
      and r.squad_id = p_squad_id
    limit 1;

    if v_row.finalized then
      raise exception 'Rating is finalized and cannot be edited';
    end if;
  end if;

  return to_jsonb(v_row);
end;
$$;

grant execute on function public.fetch_revalida_cohorts(text) to anon, authenticated;
grant execute on function public.fetch_revalida_squads(text, bigint) to anon, authenticated;
grant execute on function public.fetch_revalida_squad_members(text, uuid) to anon, authenticated;
grant execute on function public.revalida_panelist_check_in(text, uuid, text, text, bigint) to anon, authenticated;
grant execute on function public.fetch_revalida_guest_rating(text, uuid, uuid) to anon, authenticated;
grant execute on function public.submit_revalida_guest_rating(
  text, uuid, text, text, bigint, uuid,
  numeric, numeric, numeric, numeric, numeric,
  text, text, text, uuid
) to anon, authenticated;
