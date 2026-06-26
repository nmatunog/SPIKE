import type { BoardState } from '@spike-life/domain'

const boards = new Map<string, BoardState>()

export class InMemoryBoardRepository {
  async findById(id: string): Promise<BoardState | null> {
    const state = boards.get(id)
    return state ? structuredClone(state) : null
  }

  async save(state: BoardState): Promise<void> {
    boards.set(state.id, structuredClone(state))
  }

  clear(): void {
    boards.clear()
  }
}
