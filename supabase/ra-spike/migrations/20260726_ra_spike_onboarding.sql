-- RA-SPIKE Phase 2 — simplified onboarding (agency / batch / profile)

alter table public.profiles
  add column if not exists mobile text,
  add column if not exists avatar_url text;

alter table public.cohorts
  add column if not exists agency text,
  add column if not exists unit_manager text,
  add column if not exists batch_label text,
  add column if not exists batch_invite_code text,
  add column if not exists signup_open boolean not null default true;

create unique index if not exists cohorts_batch_invite_code_uidx
  on public.cohorts (upper(batch_invite_code))
  where batch_invite_code is not null and batch_invite_code <> '';

-- Demo RA-SPIKE batch (idempotent — updates first ra-spike cohort or active cohort)
update public.cohorts c
set
  program_slug = 'ra-spike',
  agency = coalesce(c.agency, 'Matunog District'),
  unit_manager = coalesce(c.unit_manager, 'Demo Unit Manager'),
  batch_label = coalesce(c.batch_label, 'RA-SPIKE Batch 1'),
  batch_invite_code = coalesce(c.batch_invite_code, 'RASPIKE2026'),
  signup_open = true,
  is_active = true
where c.id = (
  select id from public.cohorts
  where program_slug = 'ra-spike' or is_active = true
  order by case when program_slug = 'ra-spike' then 0 else 1 end, id
  limit 1
);

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

  if nullif(trim(p_invite_code), '') is null then
    raise exception 'Batch invite code is required.';
  end if;

  select * into row
  from public.cohorts c
  where coalesce(c.program_slug, 'spike-internship') = 'ra-spike'
    and coalesce(c.signup_open, true) = true
    and upper(c.batch_invite_code) = upper(trim(p_invite_code))
  order by c.id
  limit 1;

  if not found then
    raise exception 'Invalid batch invite code.';
  end if;

  return row;
end;
$$;

grant execute on function public.resolve_ra_spike_cohort(text, bigint) to authenticated, anon;
