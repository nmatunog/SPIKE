import type {
  BoardPhase,
  BoardState,
  EncounterCardId,
  SpaceType,
} from '@spike-life/domain'
import type { SpaceIconId } from '@spike-life/ui/layout'

export interface BoardSpaceView {
  index: number
  boardIndex: number
  id: string
  type: SpaceType
  category: SpaceType
  label: string
  color: string
  icon: SpaceIconId
  description?: string
  encounterId: EncounterCardId
  encounterTitle: string
  /** Normalized 0–1 coordinates from layout engine */
  x: number
  y: number
  angle: number
}

export interface BoardTokenView {
  playerId: string
  displayName: string
  position: number
  color: string
  isCurrent: boolean
}

export interface EncounterCardView {
  id: EncounterCardId
  title: string
  teaser: string
  learningConcept: string
}

export interface SpatialBoardView {
  boardId: string
  simulationId: string
  phase: BoardPhase
  roundNumber: number
  boardYear: number
  maxRounds: number
  lastDiceRoll: number | null
  canRoll: boolean
  canEndTurn: boolean
  gameComplete: boolean
  currentPlayerId: string
  spaces: BoardSpaceView[]
  tokens: BoardTokenView[]
  activeEncounter: EncounterCardView | null
  landedSpaceIndex: number | null
  trackPath: string
  layout: string
}
