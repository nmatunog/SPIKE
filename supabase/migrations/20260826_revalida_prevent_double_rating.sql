-- RA-SPIKE Revalida — one rating per panelist per squad (upsert + duplicate-name guard)

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
  v_other_token uuid;
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

  select c.panelist_token into v_other_token
  from public.revalida_panelist_checkins c
  where c.cohort_id = v_cohort
    and lower(trim(c.panelist_name)) = lower(v_name)
    and c.panelist_token <> p_panelist_token
  limit 1;

  if v_other_token is not null then
    raise exception 'This panelist name is already checked in on another device. Use that browser or ask staff for help.';
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
  v_rec text := nullif(trim(coalesce(p_recommendation, '')), '');
  v_row public.revalida_panel_ratings%rowtype;
  v_other_token uuid;
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  if v_name = '' then
    raise exception 'Panelist name is required';
  end if;

  if v_rec is not null and v_rec not in ('ready', 'ready_with_revisions', 'needs_development') then
    raise exception 'Invalid recommendation';
  end if;

  select r.panelist_token into v_other_token
  from public.revalida_panel_ratings r
  where r.cohort_id = p_cohort_id
    and r.squad_id = p_squad_id
    and r.panelist_token is not null
    and r.panelist_token <> p_panelist_token
    and lower(trim(r.panelist_name)) = lower(v_name)
  limit 1;

  if v_other_token is not null then
    raise exception 'You already saved a rating for this squad under this name. Continue on your original device.';
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
    v_rec,
    p_standout_participant_id
  )
  on conflict (panelist_token, squad_id) where panelist_token is not null do update
  set
    panelist_name = excluded.panelist_name,
    panelist_org = excluded.panelist_org,
    fvp_score = coalesce(excluded.fvp_score, revalida_panel_ratings.fvp_score),
    business_model_score = coalesce(excluded.business_model_score, revalida_panel_ratings.business_model_score),
    strategy_score = coalesce(excluded.strategy_score, revalida_panel_ratings.strategy_score),
    presentation_score = coalesce(excluded.presentation_score, revalida_panel_ratings.presentation_score),
    investment_score = coalesce(excluded.investment_score, revalida_panel_ratings.investment_score),
    greatest_strength = excluded.greatest_strength,
    improvement = excluded.improvement,
    recommendation = coalesce(excluded.recommendation, revalida_panel_ratings.recommendation),
    standout_participant_id = coalesce(
      excluded.standout_participant_id,
      revalida_panel_ratings.standout_participant_id
    ),
    updated_at = now()
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

create or replace function public.submit_revalida_staff_rating(
  p_cohort_id bigint,
  p_squad_id uuid,
  p_panelist_name text,
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
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_panelist_name, ''));
  v_rec text := nullif(trim(coalesce(p_recommendation, '')), '');
  v_row public.revalida_panel_ratings%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Not authorized';
  end if;

  if v_name = '' then
    raise exception 'Panelist name is required';
  end if;

  if v_rec is not null and v_rec not in ('ready', 'ready_with_revisions', 'needs_development') then
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
    v_uid,
    null,
    v_name,
    '',
    p_cohort_id,
    p_squad_id,
    p_fvp_score,
    p_business_model_score,
    p_strategy_score,
    p_presentation_score,
    p_investment_score,
    trim(coalesce(p_greatest_strength, '')),
    trim(coalesce(p_improvement, '')),
    v_rec,
    p_standout_participant_id
  )
  on conflict (panelist_id, squad_id) where panelist_id is not null do update
  set
    panelist_name = excluded.panelist_name,
    fvp_score = coalesce(excluded.fvp_score, revalida_panel_ratings.fvp_score),
    business_model_score = coalesce(excluded.business_model_score, revalida_panel_ratings.business_model_score),
    strategy_score = coalesce(excluded.strategy_score, revalida_panel_ratings.strategy_score),
    presentation_score = coalesce(excluded.presentation_score, revalida_panel_ratings.presentation_score),
    investment_score = coalesce(excluded.investment_score, revalida_panel_ratings.investment_score),
    greatest_strength = excluded.greatest_strength,
    improvement = excluded.improvement,
    recommendation = coalesce(excluded.recommendation, revalida_panel_ratings.recommendation),
    standout_participant_id = coalesce(
      excluded.standout_participant_id,
      revalida_panel_ratings.standout_participant_id
    ),
    updated_at = now()
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

grant execute on function public.submit_revalida_staff_rating(
  bigint, uuid, text,
  numeric, numeric, numeric, numeric, numeric,
  text, text, text, uuid
) to authenticated;
