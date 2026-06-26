import type { GameRoomState } from '../aggregates/game-room.js'

export interface GameRoomRepository {
  save(room: GameRoomState): Promise<void>
  findById(id: string): Promise<GameRoomState | null>
}
