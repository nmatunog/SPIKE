-- RA-SPIKE Revalida — allow draft saves anytime (partial scores, edits after finalize)

alter table public.revalida_panel_ratings
  alter column fvp_score drop not null,
  alter column business_model_score drop not null,
  alter column strategy_score drop not null,
  alter column presentation_score drop not null,
  alter column investment_score drop not null;

alter table public.revalida_panel_ratings
  drop constraint if exists revalida_panel_ratings_recommendation_check;

alter table public.revalida_panel_ratings
  alter column recommendation drop not null;

alter table public.revalida_panel_ratings
  add constraint revalida_panel_ratings_recommendation_check
  check (
    recommendation is null
    or recommendation in ('ready', 'ready_with_revisions', 'needs_development')
  );

drop policy if exists revalida_panel_ratings_update_own on public.revalida_panel_ratings;

create policy revalida_panel_ratings_update_own on public.revalida_panel_ratings
for update using (
  public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
  and panelist_id = auth.uid()
);

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
  on conflict (panelist_token, squad_id) do update
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
