import type { BoardState, EncounterCardId, SpaceType } from '@spike-life/domain'
import { getEncounterCard, getLifeDomainGrid, getDomainAnimationCycleIds, buildSituationShuffleCards } from '@spike-life/domain'
import { DEFAULT_BOARD_CONFIG } from '@spike-life/board-config'
import { generateBoardLayout } from '@spike-life/ui/layout'
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

export function projectSpatialBoard(board: BoardState): SpatialBoardView {
  const currentPlayerId = board.turnOrder[board.currentPlayerIndex] ?? board.turnOrder[0] ?? 'solo'
  const layoutResult = generateBoardLayout(DEFAULT_BOARD_CONFIG)

  const spaces: BoardSpaceView[] = layoutResult.spaces.map((space) => {
    const domainSpace = board.spaces.find((s) => s.index === space.boardIndex)
    const encounterId = (domainSpace?.encounterId ?? space.encounterId) as EncounterCardId
    const encounter = getEncounterCard(encounterId)

    return {
      index: space.boardIndex,
      boardIndex: space.boardIndex,
      id: space.id,
      type: (domainSpace?.type ?? space.category) as SpaceType,
      category: space.category as SpaceType,
      label: domainSpace?.label ?? space.name,
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

  return {
    boardId: board.id,
    simulationId: board.simulationId,
    phase: board.phase,
    roundNumber: board.roundNumber,
    boardYear: board.boardYear,
    maxRounds: board.maxRounds,
    lastDiceRoll: board.lastDiceRoll,
    lastCategoryDieRoll: board.lastCategoryDieRoll ?? null,
    lastSituationDieRoll: board.lastSituationDieRoll ?? null,
    rolledCategory: board.rolledCategory ?? null,
    rolledCategoryLabel: board.rolledCategoryLabel ?? null,
    selectedDomainId: board.selectedDomainId ?? null,
    selectedDomainLabel: board.rolledCategoryLabel ?? null,
    lifeDomains: getLifeDomainGrid().map((domain) => ({
      id: domain.id,
      label: domain.label,
      category: domain.category,
      icon: domain.icon,
      color: domain.color,
    })),
    domainAnimationCycle: [...getDomainAnimationCycleIds()],
    situationShuffle:
      board.pendingEncounterId && board.selectedDomainId && board.rolledCategory
        ? buildSituationShuffleCards(
            board.selectedDomainId,
            board.rolledCategory,
            board.playerAgeSnapshot ?? 22,
            board.pendingEncounterId,
            board.completedEncounterIds ?? [],
          ).map((card) => ({
            id: card.id,
            title: card.title,
            teaser: card.teaser,
            learningConcept: card.learningConcept,
          }))
        : [],
    advisorInsightOffered: board.advisorInsightOffered ?? false,
    playerAgeSnapshot: board.playerAgeSnapshot ?? null,
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
    trackPath: layoutResult.trackPath,
    layout: DEFAULT_BOARD_CONFIG.layout,
    boardConfigId: DEFAULT_BOARD_CONFIG.id,
  }
}
