-- RA-SPIKE: allow open signup without invite code (active open cohort).

create or replace function public.resolve_ra_spike_cohort(
  p_invite_code text default null,
  p_cohort_id bigint default null
)
returns public.cohorts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.cohorts;
  invite_code text := upper(nullif(trim(regexp_replace(coalesce(p_invite_code, ''), '\s+', '', 'g')), ''));
begin
  if p_cohort_id is not null then
    select * into row
    from public.cohorts c
    where c.id = p_cohort_id
      and coalesce(c.program_slug, 'spike-internship') = 'ra-spike'
      and coalesce(c.signup_open, true) = true
    limit 1;
    if found then return row; end if;
    raise exception 'Batch is not open for enrollment.';
  end if;

  -- Optional invite code path (kept for later; not required).
  if invite_code is not null then
    select * into row
    from public.cohorts c
    where coalesce(c.program_slug, 'spike-internship') = 'ra-spike'
      and coalesce(c.signup_open, true) = true
      and upper(c.batch_invite_code) = invite_code
    order by c.id
    limit 1;
    if found then return row; end if;
    raise exception 'Invalid batch invite code.';
  end if;

  -- Open signup: active RA-SPIKE cohort with signup open, else any open cohort.
  select * into row
  from public.cohorts c
  where coalesce(c.program_slug, 'spike-internship') = 'ra-spike'
    and coalesce(c.signup_open, true) = true
    and c.is_active = true
  order by c.id desc
  limit 1;
  if found then return row; end if;

  select * into row
  from public.cohorts c
  where coalesce(c.program_slug, 'spike-internship') = 'ra-spike'
    and coalesce(c.signup_open, true) = true
  order by c.id desc
  limit 1;
  if found then return row; end if;

  raise exception 'No RA-SPIKE batch is open for enrollment.';
end;
$$;

grant execute on function public.resolve_ra_spike_cohort(text, bigint) to authenticated, anon;
