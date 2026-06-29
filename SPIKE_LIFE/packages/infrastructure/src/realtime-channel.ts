import type { GameRoomOrchestratorDeps } from '@spike-life/domain'

/**
 * Supabase Realtime channel name for a SPIKE LIFE game room.
 * Used by Portal embed (R7) — subscribe to postgres_changes on spike_life_game_rooms.
 */
export function spikeLifeRoomChannel(roomId: string): string {
  return `spike-life-room:${roomId}`
}

export function spikeLifeRoomTableTopic(): string {
  return 'spike_life_game_rooms'
}

export type GameRoomOrchestrator = GameRoomOrchestratorDeps
