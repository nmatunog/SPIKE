import type { SpaceCategory, SpaceIconId } from './board-config.js'

/** Normalized coordinates (0–1) produced by the layout engine. */
export interface PositionedSpace {
  id: string
  name: string
  /** Display alias — same as name. */
  title: string
  boardIndex: number
  category: SpaceCategory
  color: string
  icon: SpaceIconId
  description?: string
  connections: number[]
  eventPool: string[]
  encounterId: string
  encounterTitle?: string
  x: number
  y: number
  /** Tangent angle in radians — used for token orientation. */
  angle: number
}

export interface BoardTokenViewModel {
  playerId: string
  displayName: string
  position: number
  color: string
  isCurrent: boolean
}

export interface EncounterViewModel {
  id: string
  title: string
  teaser: string
  learningConcept: string
}

export type BoardPhaseView =
  | 'ready_to_roll'
  | 'decision_phase'
  | 'turn_complete'
  | 'round_complete'
  | 'game_complete'

export interface BoardViewModel {
  boardId: string
  phase: BoardPhaseView
  roundNumber: number
  boardYear: number
  maxRounds: number
  lastDiceRoll: number | null
  canRoll: boolean
  canEndTurn: boolean
  gameComplete: boolean
  currentPlayerId: string
  spaces: PositionedSpace[]
  tokens: BoardTokenViewModel[]
  activeEncounter: EncounterViewModel | null
  landedSpaceIndex: number | null
  trackPath: string
}

export interface FinancialMetricViewModel {
  label: string
  value: string
  accent?: boolean
  hint?: string
}

export interface FinancialHUDViewModel {
  characterName: string
  lifeScore: number
  netWorth: string
  monthlySurplus: string
  protection: number
  goals: number
  metrics: FinancialMetricViewModel[]
}

export interface TurnHUDViewModel {
  characterName: string
  age: number
  boardYear: number
  roundNumber: number
  maxRounds: number
  phase: BoardPhaseView
  canRoll: boolean
  lastDiceRoll: number | null
  lifeScore: number
}
