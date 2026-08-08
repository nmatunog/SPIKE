-- RA-SPIKE Revalida — only program coach may finalize ratings (not panelists)

create or replace function public._revalida_coach_ok()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(
    auth.jwt() ->> 'email',
    (select u.email from auth.users u where u.id = auth.uid()),
    ''
  )) = 'nmatunog@gmail.com'
    or public.current_role() in ('ADMIN', 'SUPERUSER');
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
  raise exception 'Only the program coach can finalize ratings';
end;
$$;

create or replace function public.finalize_revalida_panelist_ratings(p_cohort_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Only the program coach can finalize ratings';
end;
$$;

create or replace function public.finalize_revalida_cohort_ratings(p_cohort_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated integer;
  v_total integer;
  v_finalized integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public._revalida_coach_ok() then
    raise exception 'Only the program coach can finalize ratings';
  end if;

  if not exists (
    select 1 from public.cohorts c
    where c.id = p_cohort_id
      and c.program_slug = 'ra-spike'
  ) then
    raise exception 'Cohort not found';
  end if;

  select
    count(*)::integer,
    count(*) filter (where r.finalized)::integer
  into v_total, v_finalized
  from public.revalida_panel_ratings r
  where r.cohort_id = p_cohort_id;

  if v_total = 0 then
    raise exception 'No ratings to finalize yet';
  end if;

  update public.revalida_panel_ratings r
  set finalized = true,
      updated_at = now()
  where r.cohort_id = p_cohort_id
    and r.finalized = false;

  get diagnostics v_updated = row_count;

  return jsonb_build_object(
    'ok', true,
    'cohort_id', p_cohort_id,
    'finalized_count', v_updated,
    'total_count', v_total,
    'already_complete', v_finalized = v_total and v_updated = 0
  );
end;
$$;

revoke all on function public.finalize_revalida_guest_ratings(text, uuid, bigint) from public;
revoke all on function public.finalize_revalida_panelist_ratings(bigint) from public;

grant execute on function public.finalize_revalida_cohort_ratings(bigint) to authenticated;
