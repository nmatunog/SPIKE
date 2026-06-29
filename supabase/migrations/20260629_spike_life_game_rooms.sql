-- SPIKE LIFE game rooms (Portal embed + Supabase persistence)

create table if not exists public.spike_life_game_rooms (
  id text primary key,
  game_code text not null unique,
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  session_mode text not null default 'campaign'
    check (session_mode in ('campaign', 'workshop_compressed')),
  decision_timer_preset text not null default '15',
  turn_number int not null default 1,
  max_turns int not null default 20,
  life_stage text not null default 'launch',
  room_phase text not null default 'lobby',
  cycle_deadline_at timestamptz,
  join_open boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spike_life_room_slots (
  room_id text not null references public.spike_life_game_rooms(id) on delete cascade,
  slot_index int not null,
  user_id uuid references auth.users(id) on delete set null,
  player_id text not null,
  display_name text not null,
  simulation_id text not null,
  archetype_id text not null,
  token_color text not null,
  status text not null default 'joined',
  joined_at timestamptz not null default now(),
  primary key (room_id, slot_index),
  unique (room_id, player_id)
);

create table if not exists public.spike_life_simulations (
  id text primary key,
  room_id text references public.spike_life_game_rooms(id) on delete cascade,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.spike_life_room_events (
  id bigserial primary key,
  room_id text not null references public.spike_life_game_rooms(id) on delete cascade,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists spike_life_game_rooms_facilitator_idx
  on public.spike_life_game_rooms(facilitator_id);

alter table public.spike_life_game_rooms enable row level security;
alter table public.spike_life_room_slots enable row level security;
alter table public.spike_life_simulations enable row level security;
alter table public.spike_life_room_events enable row level security;

drop policy if exists spike_life_rooms_facilitator_all on public.spike_life_game_rooms;
create policy spike_life_rooms_facilitator_all on public.spike_life_game_rooms
  for all using (facilitator_id = auth.uid())
  with check (facilitator_id = auth.uid());

drop policy if exists spike_life_rooms_player_read on public.spike_life_game_rooms;
create policy spike_life_rooms_player_read on public.spike_life_game_rooms
  for select using (
    exists (
      select 1 from public.spike_life_room_slots s
      where s.room_id = spike_life_game_rooms.id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists spike_life_slots_member on public.spike_life_room_slots;
create policy spike_life_slots_member on public.spike_life_room_slots
  for all using (
    user_id = auth.uid()
    or exists (
      select 1 from public.spike_life_game_rooms r
      where r.id = room_id and r.facilitator_id = auth.uid()
    )
  );

drop policy if exists spike_life_sim_owner on public.spike_life_simulations;
create policy spike_life_sim_owner on public.spike_life_simulations
  for all using (
    exists (
      select 1 from public.spike_life_room_slots s
      where s.simulation_id = spike_life_simulations.id
        and (s.user_id = auth.uid() or exists (
          select 1 from public.spike_life_game_rooms r
          where r.id = s.room_id and r.facilitator_id = auth.uid()
        ))
    )
  );

drop policy if exists spike_life_events_member on public.spike_life_room_events;
create policy spike_life_events_member on public.spike_life_room_events
  for select using (
    exists (
      select 1 from public.spike_life_game_rooms r
      where r.id = room_id
        and (r.facilitator_id = auth.uid() or exists (
          select 1 from public.spike_life_room_slots s
          where s.room_id = r.id and s.user_id = auth.uid()
        ))
    )
  );

drop policy if exists spike_life_rooms_staff_read on public.spike_life_game_rooms;
create policy spike_life_rooms_staff_read on public.spike_life_game_rooms
  for select using (public.is_staff());
