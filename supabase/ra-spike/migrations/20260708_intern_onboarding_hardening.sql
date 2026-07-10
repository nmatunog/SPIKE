-- Intern onboarding hardening: auto intern_progress, resilient RPCs, cohort finalize.

-- 1) Create intern_progress when a new auth user is created (default INTERN profile).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_cohort_id bigint;
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'New User'),
    'INTERN'
  )
  on conflict (id) do nothing;

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

  insert into public.intern_progress (user_id, cohort_id)
  values (new.id, active_cohort_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2) Idempotent intern_progress bootstrap (self-service via RPC).
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

-- 3) Complete onboarding — upsert row if missing (welcome may have been skipped).
create or replace function public.mark_onboarding_complete(p_user_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  done boolean;
  cid bigint;
begin
  uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );

  if uid is null then
    raise exception 'Not authenticated. Sign out and sign in with your SPIKE account.';
  end if;

  if p_user_id is not null and p_user_id <> uid then
    raise exception 'User mismatch';
  end if;

  insert into public.intern_progress (user_id, onboarding_complete, onboarding_welcomed_at)
  values (uid, true, now())
  on conflict (user_id) do update
  set onboarding_complete = true,
      onboarding_welcomed_at = coalesce(public.intern_progress.onboarding_welcomed_at, now())
  returning onboarding_complete into done;

  select cohort_id into cid from public.intern_progress where user_id = uid;
  perform public.maybe_finalize_cohort_onboarding(cid);

  return coalesce(done, true);
end;
$$;

-- 4) When every squad member finishes, advance cohort phase (security definer).
create or replace function public.maybe_finalize_cohort_onboarding(p_cohort_id bigint default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cid bigint;
  total_members int;
  done_members int;
begin
  cid := p_cohort_id;
  if cid is null then
    select c.id into cid from public.cohorts c where c.is_active = true order by c.id limit 1;
  end if;
  if cid is null then
    return false;
  end if;

  select count(*)::int into total_members
  from public.formation_squad_members m
  join public.formation_squads s on s.id = m.squad_id
  where s.cohort_id = cid;

  if total_members = 0 then
    return false;
  end if;

  select count(*)::int into done_members
  from public.formation_squad_members m
  join public.formation_squads s on s.id = m.squad_id
  join public.intern_progress ip on ip.user_id = m.participant_id
  where s.cohort_id = cid and ip.onboarding_complete = true;

  if done_members >= total_members then
    update public.cohorts
    set onboarding_phase = 'onboarding_complete'
    where id = cid
      and onboarding_phase is distinct from 'onboarding_complete';
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.maybe_finalize_cohort_onboarding(bigint) to authenticated;

-- 5) Backfill any existing INTERN profiles missing intern_progress.
insert into public.intern_progress (user_id, cohort_id)
select p.id, (
  select c.id from public.cohorts c where c.is_active = true order by c.id limit 1
)
from public.profiles p
where p.role = 'INTERN'
  and not exists (select 1 from public.intern_progress ip where ip.user_id = p.id)
on conflict (user_id) do nothing;
