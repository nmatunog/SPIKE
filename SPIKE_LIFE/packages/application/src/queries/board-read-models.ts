import type {
  BoardPhase,
  BoardState,
  EncounterCardId,
  SpaceType,
} from '@spike-life/domain'
import { ENCOUNTER_DECK, getEncounterCard } from '@spike-life/domain'

export interface BoardSpaceView {
  index: number
  type: SpaceType
  label: string
  encounterId: EncounterCardId
  encounterTitle: string
  /** Normalized 0–1 coordinates for circular layout */
  x: number
  y: number
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
}
