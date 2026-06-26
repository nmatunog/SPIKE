import type { BoardState, EncounterCardId, SpaceType } from '@spike-life/domain'
import {
  DEFAULT_BOARD_CONFIG,
  buildTrackPath,
  positionSpaces,
} from '@spike-life/ui/layout'
import { getEncounterCard } from '@spike-life/domain'
import type { BoardSpaceView, EncounterCardView, SpatialBoardView } from './board-read-models.js'

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

function configSpaceForIndex(boardIndex: number) {
  return (
    DEFAULT_BOARD_CONFIG.spaces.find((s) => s.boardIndex === boardIndex) ??
    DEFAULT_BOARD_CONFIG.spaces[boardIndex]
  )
}

export function projectSpatialBoard(board: BoardState): SpatialBoardView {
  const currentPlayerId = board.turnOrder[board.currentPlayerIndex] ?? board.turnOrder[0] ?? 'solo'

  const configSpaces = board.spaces.map((space) => {
    const cfg = configSpaceForIndex(space.index)
    return {
      id: cfg?.id ?? `space-${space.index}`,
      title: space.label,
      category: space.type,
      color: cfg?.color ?? '#94A3B8',
      icon: cfg?.icon ?? 'star',
      description: cfg?.description,
      boardIndex: space.index,
      encounterId: space.encounterId,
    }
  })

  const positioned = positionSpaces(
    configSpaces,
    DEFAULT_BOARD_CONFIG.layout,
    DEFAULT_BOARD_CONFIG.layoutOptions,
  )

  const spaces: BoardSpaceView[] = positioned.map((space) => {
    const encounterId = space.encounterId as EncounterCardId
    const encounter = getEncounterCard(encounterId)
    return {
      index: space.boardIndex,
      boardIndex: space.boardIndex,
      id: space.id,
      type: space.category as SpaceType,
      category: space.category as SpaceType,
      label: space.title,
      color: space.color,
      icon: space.icon,
      description: space.description,
      encounterId,
      encounterTitle: encounter.title,
      x: space.x,
      y: space.y,
      angle: space.angle,
    }
  })

  const trackPath = buildTrackPath(
    DEFAULT_BOARD_CONFIG.layout,
    board.spaces.length,
    DEFAULT_BOARD_CONFIG.layoutOptions,
  )

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
    trackPath,
    layout: DEFAULT_BOARD_CONFIG.layout,
  }
}
