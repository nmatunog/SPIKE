-- Staff: open a RA-SPIKE playbook week for all participants (or one cohort).

create or replace function public.publish_ra_spike_week(
  p_week smallint,
  p_cohort_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  role text := public.current_role();
  w smallint := greatest(1, least(8, coalesce(p_week, 1)));
  updated_count int := 0;
begin
  if role not in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER') then
    raise exception 'Staff access required.';
  end if;

  update public.intern_progress ip
  set ra_spike_current_week = w
  where ip.program_slug = 'ra-spike'
    and coalesce(ip.ra_spike_current_week, 1) < w
    and (p_cohort_id is null or ip.cohort_id = p_cohort_id);

  get diagnostics updated_count = row_count;

  return jsonb_build_object(
    'week', w,
    'updated_count', updated_count,
    'cohort_id', p_cohort_id,
    'published_at', now()
  );
end;
$$;

grant execute on function public.publish_ra_spike_week(smallint, bigint) to authenticated;

notify pgrst, 'reload schema';
