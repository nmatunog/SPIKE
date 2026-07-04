-- RA-SPIKE: rookies self-register into squads, name squads, nominate cohort names.

create or replace function public.ra_spike_participant_cohort_id(p_uid uuid)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cid bigint;
begin
  select ip.cohort_id into cid
  from public.intern_progress ip
  where ip.user_id = p_uid
    and coalesce(ip.program_slug, 'ra-spike') = 'ra-spike';

  if cid is null then
    select c.id into cid
    from public.cohorts c
    where c.program_slug = 'ra-spike'
      and c.is_active = true
    order by c.id desc
    limit 1;
  end if;

  return cid;
end;
$$;

create or replace function public.ra_spike_create_squad(p_name text)
returns public.formation_squads
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid bigint;
  squad_name text := nullif(trim(p_name), '');
  existing uuid;
  squad public.formation_squads;
begin
  if uid is null then
    raise exception 'Not authenticated.';
  end if;
  if squad_name is null or char_length(squad_name) < 2 then
    raise exception 'Squad name must be at least 2 characters.';
  end if;

  cid := public.ra_spike_participant_cohort_id(uid);
  if cid is null then
    raise exception 'No active RA-SPIKE cohort. Ask your coach to open a batch.';
  end if;

  select m.squad_id into existing
  from public.formation_squad_members m
  where m.participant_id = uid
  limit 1;
  if existing is not null then
    raise exception 'You are already in a squad. Leave it before creating another.';
  end if;

  insert into public.formation_squads (cohort_id, name, capacity, status)
  values (cid, squad_name, 3, 'forming')
  returning * into squad;

  insert into public.formation_squad_members (squad_id, participant_id, role)
  values (squad.id, uid, 'Leader');

  update public.intern_progress
  set squad = squad_name
  where user_id = uid;

  return squad;
end;
$$;

create or replace function public.ra_spike_join_squad(p_squad_id uuid)
returns public.formation_squads
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid bigint;
  squad public.formation_squads;
  member_count integer;
  existing uuid;
begin
  if uid is null then
    raise exception 'Not authenticated.';
  end if;
  if p_squad_id is null then
    raise exception 'Squad is required.';
  end if;

  cid := public.ra_spike_participant_cohort_id(uid);
  if cid is null then
    raise exception 'No active RA-SPIKE cohort.';
  end if;

  select m.squad_id into existing
  from public.formation_squad_members m
  where m.participant_id = uid
  limit 1;
  if existing is not null then
    raise exception 'You are already in a squad.';
  end if;

  select * into squad
  from public.formation_squads s
  where s.id = p_squad_id
    and s.cohort_id = cid;
  if not found then
    raise exception 'Squad not found in your cohort.';
  end if;

  select count(*)::integer into member_count
  from public.formation_squad_members m
  where m.squad_id = squad.id;
  if member_count >= coalesce(squad.capacity, 3) then
    raise exception 'This squad is full.';
  end if;

  insert into public.formation_squad_members (squad_id, participant_id, role)
  values (squad.id, uid, 'Member');

  update public.intern_progress
  set squad = squad.name
  where user_id = uid;

  return squad;
end;
$$;

create or replace function public.ra_spike_rename_squad(p_squad_id uuid, p_name text)
returns public.formation_squads
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  squad_name text := nullif(trim(p_name), '');
  squad public.formation_squads;
  is_leader boolean;
begin
  if uid is null then
    raise exception 'Not authenticated.';
  end if;
  if squad_name is null or char_length(squad_name) < 2 then
    raise exception 'Squad name must be at least 2 characters.';
  end if;

  select exists (
    select 1
    from public.formation_squad_members m
    where m.squad_id = p_squad_id
      and m.participant_id = uid
      and m.role = 'Leader'
  ) into is_leader;
  if not is_leader then
    raise exception 'Only the squad leader can rename the squad.';
  end if;

  update public.formation_squads
  set name = squad_name
  where id = p_squad_id
  returning * into squad;
  if not found then
    raise exception 'Squad not found.';
  end if;

  update public.intern_progress ip
  set squad = squad_name
  from public.formation_squad_members m
  where m.squad_id = squad.id
    and ip.user_id = m.participant_id;

  return squad;
end;
$$;

create or replace function public.ra_spike_leave_squad()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  was_leader boolean;
  remaining integer;
begin
  if uid is null then
    raise exception 'Not authenticated.';
  end if;

  select m.squad_id, (m.role = 'Leader') into sid, was_leader
  from public.formation_squad_members m
  where m.participant_id = uid
  limit 1;
  if sid is null then
    return;
  end if;

  delete from public.formation_squad_members
  where squad_id = sid and participant_id = uid;

  update public.intern_progress set squad = null where user_id = uid;

  select count(*)::integer into remaining
  from public.formation_squad_members
  where squad_id = sid;

  if remaining = 0 then
    delete from public.formation_squads where id = sid;
  elsif was_leader then
    update public.formation_squad_members
    set role = 'Leader'
    where id = (
      select id from public.formation_squad_members
      where squad_id = sid
      order by joined_at asc nulls last
      limit 1
    );
  end if;
end;
$$;

create or replace function public.ra_spike_nominate_cohort_name(p_name text, p_reason text default '')
returns public.cohort_suggestions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid bigint;
  suggestion_name text := nullif(trim(p_name), '');
  row public.cohort_suggestions;
begin
  if uid is null then
    raise exception 'Not authenticated.';
  end if;
  if suggestion_name is null or char_length(suggestion_name) < 2 then
    raise exception 'Cohort name must be at least 2 characters.';
  end if;

  cid := public.ra_spike_participant_cohort_id(uid);
  if cid is null then
    raise exception 'No active RA-SPIKE cohort.';
  end if;

  insert into public.cohort_suggestions (cohort_id, participant_id, suggested_name, reason)
  values (cid, uid, suggestion_name, coalesce(nullif(trim(p_reason), ''), ''))
  on conflict (cohort_id, participant_id) do update
  set suggested_name = excluded.suggested_name,
      reason = excluded.reason
  returning * into row;

  return row;
end;
$$;

grant execute on function public.ra_spike_participant_cohort_id(uuid) to authenticated;
grant execute on function public.ra_spike_create_squad(text) to authenticated;
grant execute on function public.ra_spike_join_squad(uuid) to authenticated;
grant execute on function public.ra_spike_rename_squad(uuid, text) to authenticated;
grant execute on function public.ra_spike_leave_squad() to authenticated;
grant execute on function public.ra_spike_nominate_cohort_name(text, text) to authenticated;
