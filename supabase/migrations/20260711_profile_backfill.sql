-- Backfill profiles for confirmed auth users missing public.profiles rows.
-- Also harden handle_new_user so intern_progress failures never block profile creation.

create or replace function public.sync_missing_portal_profiles()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inserted integer;
begin
  if public.current_role() not in ('ADMIN', 'SUPERUSER') then
    raise exception 'Administrator access is required';
  end if;

  insert into public.profiles (id, email, name, role)
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(u.email, ''), '@', 1),
      'User'
    ),
    'INTERN'::public.app_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
  on conflict (id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.sync_missing_portal_profiles() from public;
grant execute on function public.sync_missing_portal_profiles() to authenticated;

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

  begin
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
  exception
    when others then
      null;
  end;

  return new;
end;
$$;

select public.sync_missing_portal_profiles();
