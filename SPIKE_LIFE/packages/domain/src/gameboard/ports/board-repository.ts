import type { BoardState } from '../types.js'

export interface BoardRepository {
  findById(id: string): Promise<BoardState | null>
  save(state: BoardState): Promise<void>
}
