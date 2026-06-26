import type { ScenarioId } from '../types.js'

/** Board space categories — pacing and encounter routing only. */
export type SpaceType =
  | 'career'
  | 'finance'
  | 'opportunity'
  | 'risk'
  | 'family'
  | 'health'
  | 'business'
  | 'investment'
  | 'education'
  | 'life_event'
  | 'milestone'
  | 'rest'
  | 'bonus'
  | 'community'

export type BoardPhase =
  | 'ready_to_roll'
  | 'decision_phase'
  | 'turn_complete'
  | 'round_complete'
  | 'game_complete'

export type EncounterCardId =
  | 'promotion'
  | 'salary_increase'
  | 'marriage'
  | 'business_opportunity'
  | 'vehicle_breakdown'
  | 'medical_expense'
  | 'job_loss'
  | 'economic_boom'
  | 'inflation'
  | 'education'
  | 'milestone'
  | 'rest'
  | 'bonus'
  | 'community'
  | 'investment'

export interface BoardSpace {
  index: number
  type: SpaceType
  encounterId: EncounterCardId
  label: string
}

export interface EncounterCard {
  id: EncounterCardId
  title: string
  teaser: string
  spaceTypes: SpaceType[]
  scenarioId: ScenarioId
  learningConcept: string
}

export interface PlayerToken {
  playerId: string
  displayName: string
  position: number
  color: string
}

export interface BoardState {
  id: string
  simulationId: string
  spaces: BoardSpace[]
  tokens: PlayerToken[]
  turnOrder: string[]
  currentPlayerIndex: number
  roundNumber: number
  boardYear: number
  maxRounds: number
  phase: BoardPhase
  lastDiceRoll: number | null
  pendingEncounterId: EncounterCardId | null
  landedSpaceIndex: number | null
  createdAt: string
  updatedAt: string
}

export const BOARD_DICE_MIN = 1
export const BOARD_DICE_MAX = 6
export const DEFAULT_BOARD_ROUNDS = 5
