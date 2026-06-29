import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameRoomRepository, GameRoomState } from '@spike-life/domain'

export class SupabaseGameRoomRepository implements GameRoomRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(room: GameRoomState): Promise<void> {
    const { error } = await this.client.from('spike_life_game_rooms').upsert({
      id: room.id,
      game_code: room.gameCode,
      facilitator_id: room.facilitatorId,
      session_mode: room.sessionMode,
      decision_timer_preset: room.decisionTimerPreset,
      turn_number: room.turnNumber,
      max_turns: room.maxTurns,
      life_stage: room.lifeStage,
      room_phase: room.roomPhase,
      cycle_deadline_at: room.cycleDeadlineAt,
      join_open: room.joinOpen,
      config_json: { slots: room.slots, maxPlayers: room.maxPlayers },
      updated_at: room.updatedAt,
    })
    if (error) throw new Error(error.message)

    if (room.slots.length) {
      const { error: slotError } = await this.client.from('spike_life_room_slots').upsert(
        room.slots.map((slot) => ({
          room_id: room.id,
          slot_index: slot.slotIndex,
          player_id: slot.playerId,
          display_name: slot.displayName,
          simulation_id: slot.simulationId,
          archetype_id: slot.archetypeId,
          token_color: slot.tokenColor,
          status: slot.status,
          joined_at: slot.joinedAt,
        })),
      )
      if (slotError) throw new Error(slotError.message)
    }
  }

  async findById(id: string): Promise<GameRoomState | null> {
    const { data, error } = await this.client
      .from('spike_life_game_rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null

    const { data: slots, error: slotError } = await this.client
      .from('spike_life_room_slots')
      .select('*')
      .eq('room_id', id)
      .order('slot_index')
    if (slotError) throw new Error(slotError.message)

    const config = (data.config_json as { slots?: GameRoomState['slots']; maxPlayers?: number }) ?? {}

    return {
      id: data.id,
      gameCode: data.game_code,
      facilitatorId: data.facilitator_id,
      sessionMode: data.session_mode,
      decisionTimerPreset: data.decision_timer_preset,
      turnNumber: data.turn_number,
      maxTurns: data.max_turns,
      lifeStage: data.life_stage,
      roomPhase: data.room_phase,
      cycleDeadlineAt: data.cycle_deadline_at,
      joinOpen: data.join_open,
      maxPlayers: config.maxPlayers ?? 6,
      slots: slots?.map((s) => ({
        slotIndex: s.slot_index,
        playerId: s.player_id,
        displayName: s.display_name,
        simulationId: s.simulation_id,
        archetypeId: s.archetype_id,
        tokenColor: s.token_color,
        status: s.status,
        joinedAt: s.joined_at,
      })) ?? config.slots ?? [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}
