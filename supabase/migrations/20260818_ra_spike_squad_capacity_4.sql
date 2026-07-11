-- RA-SPIKE squads: max 4 members per squad (was 3).

update public.formation_squads s
set capacity = 4
from public.cohorts c
where c.id = s.cohort_id
  and c.program_slug = 'ra-spike'
  and s.capacity < 4;

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
  values (cid, squad_name, 4, 'forming')
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
  if member_count >= coalesce(squad.capacity, 4) then
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

grant execute on function public.ra_spike_create_squad(text) to authenticated;
grant execute on function public.ra_spike_join_squad(uuid) to authenticated;

notify pgrst, 'reload schema';
