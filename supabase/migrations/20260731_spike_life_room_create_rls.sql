-- SPIKE LIFE: allow authenticated hosts to create rooms and seed player simulations.

drop policy if exists spike_life_rooms_auth_insert on public.spike_life_game_rooms;
create policy spike_life_rooms_auth_insert on public.spike_life_game_rooms
  for insert
  to authenticated
  with check (facilitator_id = auth.uid());

drop policy if exists spike_life_sim_facilitator_write on public.spike_life_simulations;
create policy spike_life_sim_facilitator_write on public.spike_life_simulations
  for insert
  to authenticated
  with check (
    room_id is not null
    and public.spike_life_is_facilitator(room_id)
  );

drop policy if exists spike_life_sim_player_write on public.spike_life_simulations;
create policy spike_life_sim_player_write on public.spike_life_simulations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.spike_life_room_slots s
      where s.simulation_id = spike_life_simulations.id
        and s.user_id = auth.uid()
    )
  );
