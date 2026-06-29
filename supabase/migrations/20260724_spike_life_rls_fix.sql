-- Fix infinite RLS recursion on spike_life_game_rooms ↔ spike_life_room_slots
-- and allow join lookup before a player has a slot.

create or replace function public.spike_life_is_facilitator(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.spike_life_game_rooms r
    where r.id = p_room_id
      and r.facilitator_id = auth.uid()
  );
$$;

create or replace function public.spike_life_is_player(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.spike_life_room_slots s
    where s.room_id = p_room_id
      and s.user_id = auth.uid()
  );
$$;

create or replace function public.spike_life_can_access_room(p_room_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.spike_life_is_facilitator(p_room_id)
      or public.spike_life_is_player(p_room_id)
      or public.is_staff();
$$;

create or replace function public.spike_life_owns_simulation(p_simulation_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.spike_life_room_slots s
    join public.spike_life_game_rooms r on r.id = s.room_id
    where s.simulation_id = p_simulation_id
      and (
        s.user_id = auth.uid()
        or r.facilitator_id = auth.uid()
      )
  );
$$;

-- game_rooms
drop policy if exists spike_life_rooms_player_read on public.spike_life_game_rooms;
create policy spike_life_rooms_player_read on public.spike_life_game_rooms
  for select using (public.spike_life_is_player(id));

drop policy if exists spike_life_rooms_join_lookup on public.spike_life_game_rooms;
create policy spike_life_rooms_join_lookup on public.spike_life_game_rooms
  for select using (join_open = true and auth.uid() is not null);

-- room_slots
drop policy if exists spike_life_slots_member on public.spike_life_room_slots;
create policy spike_life_slots_member on public.spike_life_room_slots
  for all using (
    user_id = auth.uid()
    or public.spike_life_is_facilitator(room_id)
  )
  with check (
    user_id = auth.uid()
    or public.spike_life_is_facilitator(room_id)
  );

-- simulations
drop policy if exists spike_life_sim_owner on public.spike_life_simulations;
create policy spike_life_sim_owner on public.spike_life_simulations
  for all using (public.spike_life_owns_simulation(id))
  with check (public.spike_life_owns_simulation(id));

-- events
drop policy if exists spike_life_events_member on public.spike_life_room_events;
create policy spike_life_events_member on public.spike_life_room_events
  for select using (public.spike_life_can_access_room(room_id));

drop policy if exists spike_life_events_facilitator_write on public.spike_life_room_events;
create policy spike_life_events_facilitator_write on public.spike_life_room_events
  for insert with check (public.spike_life_is_facilitator(room_id));
