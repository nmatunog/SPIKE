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
  | (string & {})

export type BoardPhase =
  | 'ready_to_roll'
  | 'category_rolled'
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
  | 'annual_checkup'
  | 'minor_injury'
  | 'hospitalization'
  | 'first_home'
  | 'rent_increase'
  | 'job_loss'
  | 'economic_boom'
  | 'inflation'
  | 'education'
  | 'milestone'
  | 'rest'
  | 'bonus'
  | 'community'
  | 'investment'
  | 'first_job'
  | 'internship'
  | 'job_offer'
  | 'executive_promotion'
  | 'retirement_offer'
  | 'redundancy'
  | 'consulting_opportunity'
  | 'emergency_fund'
  | 'credit_decision'
  | 'tax_season'
  | 'pagibig_loan'
  | 'relationship_finances'
  | 'legacy_planning'

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
  /** Primary life-domain tile ids (preferred over spaceTypes). */
  domainIds?: string[]
  ageMin?: number
  ageMax?: number
  /** Per life-stage band weights for situation selection. */
  weightsByBand?: Partial<Record<'launch' | 'mid' | 'late', number>>
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
  /** @deprecated Use lastCategoryDieRoll — kept for HUD compatibility */
  lastDiceRoll: number | null
  lastCategoryDieRoll: number | null
  lastSituationDieRoll: number | null
  rolledCategory: SpaceType | null
  rolledCategoryLabel: string | null
  selectedDomainId: string | null
  pendingEncounterId: EncounterCardId | null
  /** ~27% of years — optional advisor insight before decision (UI only). */
  advisorInsightOffered: boolean
  /** Character age when the current year began — drives situation shuffle UI. */
  playerAgeSnapshot: number | null
  landedSpaceIndex: number | null
  /** Encounters already played — drives career progression gates. */
  completedEncounterIds: EncounterCardId[]
  createdAt: string
  updatedAt: string
}

export const BOARD_DICE_MIN = 1
export const BOARD_DICE_MAX = 6
export const DEFAULT_BOARD_ROUNDS = 5
