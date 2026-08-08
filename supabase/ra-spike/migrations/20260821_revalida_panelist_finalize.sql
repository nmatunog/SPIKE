-- RA-SPIKE Revalida — fetch all panelist ratings + finalize portfolio when every squad is rated

create or replace function public.fetch_revalida_guest_ratings(
  p_pin text,
  p_panelist_token uuid,
  p_cohort_id bigint
)
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
    select jsonb_agg(to_jsonb(r) order by r.submitted_at)
    from public.revalida_panel_ratings r
    where r.panelist_token = p_panelist_token
      and r.cohort_id = p_cohort_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.fetch_revalida_panelist_ratings(p_cohort_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Not authorized';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.submitted_at)
    from public.revalida_panel_ratings r
    where r.panelist_id = v_uid
      and r.cohort_id = p_cohort_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public._revalida_finalize_panelist_ratings(
  p_cohort_id bigint,
  p_panelist_id uuid,
  p_panelist_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_squad_count integer;
  v_rating_count integer;
  v_finalized_count integer;
begin
  select count(*)::integer into v_squad_count
  from public.formation_squads s
  where s.cohort_id = p_cohort_id
    and s.status = 'active';

  if v_squad_count = 0 then
    raise exception 'No active squads in this cohort';
  end if;

  select
    count(*)::integer,
    count(*) filter (where r.finalized)::integer
  into v_rating_count, v_finalized_count
  from public.revalida_panel_ratings r
  where r.cohort_id = p_cohort_id
    and (
      (p_panelist_id is not null and r.panelist_id = p_panelist_id)
      or (p_panelist_token is not null and r.panelist_token = p_panelist_token)
    );

  if v_rating_count < v_squad_count then
    raise exception 'Rate every squad before final submission (% of % done)', v_rating_count, v_squad_count;
  end if;

  if v_finalized_count = v_rating_count then
    return jsonb_build_object('ok', true, 'already_finalized', true, 'count', v_rating_count);
  end if;

  update public.revalida_panel_ratings r
  set finalized = true,
      updated_at = now()
  where r.cohort_id = p_cohort_id
    and r.finalized = false
    and (
      (p_panelist_id is not null and r.panelist_id = p_panelist_id)
      or (p_panelist_token is not null and r.panelist_token = p_panelist_token)
    );

  return jsonb_build_object('ok', true, 'finalized', true, 'count', v_rating_count);
end;
$$;

create or replace function public.finalize_revalida_guest_ratings(
  p_pin text,
  p_panelist_token uuid,
  p_cohort_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._revalida_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  return public._revalida_finalize_panelist_ratings(p_cohort_id, null, p_panelist_token);
end;
$$;

create or replace function public.finalize_revalida_panelist_ratings(p_cohort_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_role() not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Not authorized';
  end if;

  return public._revalida_finalize_panelist_ratings(p_cohort_id, v_uid, null);
end;
$$;

grant execute on function public.fetch_revalida_guest_ratings(text, uuid, bigint) to anon, authenticated;
grant execute on function public.fetch_revalida_panelist_ratings(bigint) to authenticated;
grant execute on function public.finalize_revalida_guest_ratings(text, uuid, bigint) to anon, authenticated;
grant execute on function public.finalize_revalida_panelist_ratings(bigint) to authenticated;
