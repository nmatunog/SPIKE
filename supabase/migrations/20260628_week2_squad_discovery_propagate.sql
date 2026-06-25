-- Squad Week 2 discovery: interns read squadmates' playbook rows; propagate fullest save to empty members.

drop policy if exists playbook_completions_select_squad_mates on public.playbook_completions;
create policy playbook_completions_select_squad_mates on public.playbook_completions
for select
using (
  exists (
    select 1
    from public.formation_squad_members me
    join public.formation_squad_members mate on mate.squad_id = me.squad_id
    where me.participant_id = auth.uid()
      and mate.participant_id = playbook_completions.user_id
  )
);

create or replace function public.week2_discovery_state_empty(state jsonb)
returns boolean
language sql
immutable
as $$
  select
    coalesce(state->>'missionAcknowledged', 'false') is distinct from 'true'
    and coalesce(jsonb_array_length(state->'assumptions'), 0) = 0
    and coalesce(length(btrim(state->>'fieldResearchPlan')), 0) < 10
    and coalesce(
      (
        select count(*)::int
        from jsonb_array_elements(coalesce(state->'interviews', '[]'::jsonb)) iv
        where coalesce(iv->>'encoded', 'false') = 'true'
      ),
      0,
    ) = 0;
$$;

create or replace function public.week2_discovery_day1_complete(state jsonb)
returns boolean
language sql
immutable
as $$
  select
    coalesce(state->>'missionAcknowledged', 'false') = 'true'
    and coalesce(state->>'assumptionsCompletedAt', '') <> ''
    and coalesce(state->>'guideCompletedAt', '') <> ''
    and coalesce(state->>'researchPlanSubmittedAt', '') <> ''
    and coalesce(state->>'squadAlignedAt', '') <> '';
$$;

create or replace function public.propagate_week2_discovery_to_empty_squad_mates()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  source_user uuid;
  source_state jsonb;
  source_payload jsonb;
  target_user uuid;
  adopted uuid[] := '{}';
begin
  if caller_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select pc.user_id, pc.payload->'state'
  into source_user, source_state
  from public.playbook_completions pc
  join public.formation_squad_members me on me.participant_id = caller_id
  join public.formation_squad_members mate on mate.squad_id = me.squad_id and mate.participant_id = pc.user_id
  where pc.item_type = 'activity'
    and pc.item_id = 'week2-discovery'
    and pc.day_id = 'week-segment-1-2'
    and public.week2_discovery_day1_complete(pc.payload->'state')
  order by coalesce(pc.payload->>'updatedAt', pc.updated_at::text) desc
  limit 1;

  if source_user is null or source_state is null then
    return jsonb_build_object('ok', true, 'adopted', adopted, 'skipped', 'no_full_source');
  end if;

  source_payload := jsonb_build_object(
    'state', source_state,
    'updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );

  for target_user in
    select mate.participant_id
    from public.formation_squad_members me
    join public.formation_squad_members mate on mate.squad_id = me.squad_id
    where me.participant_id = caller_id
      and mate.participant_id <> source_user
  loop
    if exists (
      select 1
      from public.playbook_completions pc
      where pc.user_id = target_user
        and pc.item_type = 'activity'
        and pc.item_id = 'week2-discovery'
        and pc.day_id = 'week-segment-1-2'
        and not public.week2_discovery_state_empty(pc.payload->'state')
    ) then
      continue;
    end if;

    insert into public.playbook_completions (
      user_id, item_type, item_id, day_id, payload, completed_at, updated_at
    )
    values (
      target_user,
      'activity',
      'week2-discovery',
      'week-segment-1-2',
      source_payload,
      now(),
      now()
    )
    on conflict (user_id, item_type, item_id) do update
      set payload = excluded.payload,
          completed_at = excluded.completed_at,
          updated_at = excluded.updated_at;

    adopted := array_append(adopted, target_user);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'source_user', source_user,
    'adopted', adopted
  );
end;
$$;

revoke all on function public.propagate_week2_discovery_to_empty_squad_mates() from public;
grant execute on function public.propagate_week2_discovery_to_empty_squad_mates() to authenticated;
