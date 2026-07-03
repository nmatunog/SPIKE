import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameRoomRepository, GameRoomState } from '@spike-life/domain'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class SupabaseGameRoomRepository implements GameRoomRepository {
  private pendingAuthLinkPlayerId: string | null = null

  constructor(private readonly client: SupabaseClient) {}

  /** Link the next saved slot for this player id to the signed-in Supabase user. */
  linkNextSlotToAuth(playerId: string | null) {
    this.pendingAuthLinkPlayerId = playerId
  }

  private async authUserId(): Promise<string | null> {
    const { data: sessionData } = await this.client.auth.getSession()
    if (sessionData.session?.user?.id) {
      return sessionData.session.user.id
    }
    const { data } = await this.client.auth.getUser()
    return data.user?.id ?? null
  }

  private resolveHostAuthId(room: GameRoomState, authUid: string | null): string | null {
    const hostId = room.hostPlayerId ?? room.facilitatorId ?? null
    if (!authUid) return hostId
    // Empty room on create has no host yet — bind facilitator to the signed-in user.
    if (!hostId || !UUID_RE.test(String(hostId))) {
      return authUid
    }
    return hostId
  }

  async save(room: GameRoomState): Promise<void> {
    const authUid = await this.authUserId()
    const hostAuthId = this.resolveHostAuthId(room, authUid)
    if (!hostAuthId) {
      throw new Error('Sign in to create or save a SPIKE LIFE multiplayer room.')
    }

    const { error } = await this.client.from('spike_life_game_rooms').upsert({
      id: room.id,
      game_code: room.gameCode,
      facilitator_id: hostAuthId,
      session_mode: room.sessionMode,
      decision_timer_preset: room.decisionTimerPreset,
      turn_number: room.turnNumber,
      max_turns: room.maxTurns,
      life_stage: room.lifeStage,
      room_phase: room.roomPhase,
      cycle_deadline_at: room.cycleDeadlineAt,
      join_open: room.joinOpen,
      config_json: {
        slots: room.slots,
        maxPlayers: room.maxPlayers,
        hostPlayerId: room.hostPlayerId,
      },
      updated_at: room.updatedAt,
    })
    if (error) throw new Error(error.message)

    if (room.slots.length) {
      const { data: existingSlots } = await this.client
        .from('spike_life_room_slots')
        .select('slot_index, user_id')
        .eq('room_id', room.id)

      const userIdBySlot = new Map(
        (existingSlots ?? []).map((row) => [row.slot_index as number, row.user_id as string | null]),
      )

      const { error: slotError } = await this.client.from('spike_life_room_slots').upsert(
        room.slots.map((slot) => {
          let userId = userIdBySlot.get(slot.slotIndex) ?? null
          if (
            authUid
            && this.pendingAuthLinkPlayerId
            && slot.playerId === this.pendingAuthLinkPlayerId
          ) {
            userId = authUid
          }

          return {
            room_id: room.id,
            slot_index: slot.slotIndex,
            user_id: userId,
            player_id: slot.playerId,
            display_name: slot.displayName,
            simulation_id: slot.simulationId,
            archetype_id: slot.archetypeId,
            token_color: slot.tokenColor,
            status: slot.status,
            joined_at: slot.joinedAt,
          }
        }),
      )
      if (slotError) throw new Error(slotError.message)
    }

    this.pendingAuthLinkPlayerId = null
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

    const config = (data.config_json as {
      slots?: GameRoomState['slots']
      maxPlayers?: number
      hostPlayerId?: string | null
    }) ?? {}

    return {
      id: data.id,
      gameCode: data.game_code,
      hostPlayerId: config.hostPlayerId ?? config.slots?.[0]?.playerId ?? null,
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
      slots:
        slots?.map((s) => ({
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
