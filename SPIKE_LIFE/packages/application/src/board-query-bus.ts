import type { BoardRepository } from '@spike-life/domain'
import type { SpatialBoardView } from './queries/board-read-models.js'
import { projectSpatialBoard } from './queries/board-projections.js'

export class BoardQueryBus {
  constructor(private readonly boardRepo: BoardRepository) {}

  async getSpatialBoard(boardId: string): Promise<SpatialBoardView | null> {
    const board = await this.boardRepo.findById(boardId)
    if (!board) return null
    return projectSpatialBoard(board)
  }
}
