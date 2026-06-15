-- Catch-up: ensure_intern_progress RPC + backfill rows (if 20260708 was not applied).
-- After running: NOTIFY pgrst, 'reload schema';

create or replace function public.ensure_intern_progress(
  p_user_id uuid default null,
  p_university text default null,
  p_squad text default null
)
returns public.intern_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  active_cohort_id bigint;
  row public.intern_progress;
begin
  uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );

  if uid is null then
    raise exception 'Not authenticated.';
  end if;

  if p_user_id is not null and p_user_id <> uid then
    raise exception 'User mismatch';
  end if;

  select c.id into active_cohort_id
  from public.cohorts c
  where c.is_active = true
  order by c.id
  limit 1;

  if active_cohort_id is null then
    select c.id into active_cohort_id
    from public.cohorts c
    order by c.id
    limit 1;
  end if;

  insert into public.intern_progress (user_id, cohort_id, university, squad)
  values (uid, active_cohort_id, nullif(trim(p_university), ''), nullif(trim(p_squad), ''))
  on conflict (user_id) do update
  set
    cohort_id = coalesce(public.intern_progress.cohort_id, excluded.cohort_id),
    university = coalesce(nullif(trim(excluded.university), ''), public.intern_progress.university),
    squad = coalesce(nullif(trim(excluded.squad), ''), public.intern_progress.squad)
  returning * into row;

  return row;
end;
$$;

grant execute on function public.ensure_intern_progress(uuid, text, text) to authenticated;

insert into public.intern_progress (user_id, cohort_id)
select p.id, (
  select c.id from public.cohorts c where c.is_active = true order by c.id limit 1
)
from public.profiles p
where p.role = 'INTERN'
  and not exists (select 1 from public.intern_progress ip where ip.user_id = p.id)
on conflict (user_id) do nothing;
