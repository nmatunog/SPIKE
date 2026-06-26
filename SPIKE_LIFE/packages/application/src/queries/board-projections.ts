import type { BoardState } from '@spike-life/domain'
import { getEncounterCard } from '@spike-life/domain'
import type { BoardSpaceView, EncounterCardView, SpatialBoardView } from './board-read-models.js'

function serpentineCoords(index: number, total: number, cols = 4): { x: number; y: number } {
  const rows = Math.ceil(total / cols)
  const row = Math.floor(index / cols)
  const colInRow = index % cols
  const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow

  const paddingX = 0.1
  const paddingY = 0.12
  const usableX = 1 - 2 * paddingX
  const usableY = 1 - 2 * paddingY
  const x = paddingX + (cols <= 1 ? 0.5 : (col / (cols - 1)) * usableX)
  const y = paddingY + (rows <= 1 ? 0.5 : (row / (rows - 1)) * usableY)

  return { x, y }
}

function projectEncounter(id: BoardState['pendingEncounterId']): EncounterCardView | null {
  if (!id) return null
  const card = getEncounterCard(id)
  return {
    id: card.id,
    title: card.title,
    teaser: card.teaser,
    learningConcept: card.learningConcept,
  }
}

export function projectSpatialBoard(board: BoardState): SpatialBoardView {
  const currentPlayerId = board.turnOrder[board.currentPlayerIndex] ?? board.turnOrder[0] ?? 'solo'

  const spaces: BoardSpaceView[] = board.spaces.map((space) => {
    const { x, y } = serpentineCoords(space.index, board.spaces.length)
    const encounter = getEncounterCard(space.encounterId)
    return {
      index: space.index,
      type: space.type,
      label: space.label,
      encounterId: space.encounterId,
      encounterTitle: encounter.title,
      x,
      y,
    }
  })

  return {
    boardId: board.id,
    simulationId: board.simulationId,
    phase: board.phase,
    roundNumber: board.roundNumber,
    boardYear: board.boardYear,
    maxRounds: board.maxRounds,
    lastDiceRoll: board.lastDiceRoll,
    canRoll: board.phase === 'ready_to_roll',
    canEndTurn: board.phase === 'turn_complete',
    gameComplete: board.phase === 'game_complete',
    currentPlayerId,
    spaces,
    tokens: board.tokens.map((token) => ({
      playerId: token.playerId,
      displayName: token.displayName,
      position: token.position,
      color: token.color,
      isCurrent: token.playerId === currentPlayerId,
    })),
    activeEncounter: projectEncounter(board.pendingEncounterId),
    landedSpaceIndex: board.landedSpaceIndex,
  }
}
