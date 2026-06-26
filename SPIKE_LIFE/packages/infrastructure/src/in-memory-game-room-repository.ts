import type { GameRoomRepository } from '@spike-life/domain'
import type { GameRoomState } from '@spike-life/domain'

export class InMemoryGameRoomRepository implements GameRoomRepository {
  private readonly store = new Map<string, GameRoomState>()

  async save(room: GameRoomState): Promise<void> {
    this.store.set(room.id, structuredClone(room))
  }

  async findById(id: string): Promise<GameRoomState | null> {
    const room = this.store.get(id)
    return room ? structuredClone(room) : null
  }

  clear(): void {
    this.store.clear()
  }
}
