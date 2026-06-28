import type { EncounterCardId } from '../types.js'
import type { ScenarioId } from '../../types.js'

export const GameboardEventType = {
  DOMAIN_SELECTED: 'DomainSelected',
  CATEGORY_DIE_ROLLED: 'CategoryDieRolled',
  SITUATION_DIE_ROLLED: 'SituationDieRolled',
  DICE_ROLLED: 'DiceRolled',
  PLAYER_MOVED: 'PlayerMoved',
  PLAYER_LANDED: 'PlayerLanded',
  SITUATION_TRIGGERED: 'SituationTriggered',
  DECISION_PHASE_STARTED: 'DecisionPhaseStarted',
  DECISION_SUBMITTED: 'DecisionSubmitted',
  OUTCOME_RESOLVED: 'OutcomeResolved',
  REFLECTION_COMPLETED: 'ReflectionCompleted',
  TURN_COMPLETED: 'TurnCompleted',
  ROUND_COMPLETED: 'RoundCompleted',
} as const

export type GameboardEventTypeName =
  (typeof GameboardEventType)[keyof typeof GameboardEventType]

export interface GameboardEvent<T = unknown> {
  type: GameboardEventTypeName
  boardId: string
  occurredAt: string
  payload: T
}

export interface DiceRolledPayload {
  playerId: string
  value: number
}

export interface CategoryDieRolledPayload {
  playerId: string
  value: number
  category: string
  categoryLabel: string
}

export interface DomainSelectedPayload {
  playerId: string
  domainId: string
  domainLabel: string
  category: string
}

export interface SituationDieRolledPayload {
  playerId: string
  value: number
  category: string
  encounterId: EncounterCardId
}

export interface PlayerMovedPayload {
  playerId: string
  fromPosition: number
  toPosition: number
  steps: number
}

export interface PlayerLandedPayload {
  playerId: string
  spaceIndex: number
  spaceLabel: string
  encounterId: EncounterCardId
}

export interface SituationTriggeredPayload {
  playerId: string
  encounterId: EncounterCardId
  scenarioId: ScenarioId
  simulationId: string
}

export interface DecisionPhaseStartedPayload {
  playerId: string
  encounterId: EncounterCardId
}

export interface TurnCompletedPayload {
  playerId: string
  roundNumber: number
}

export interface RoundCompletedPayload {
  roundNumber: number
  boardYear: number
}

export function createGameboardEvent<T>(
  type: GameboardEventTypeName,
  boardId: string,
  payload: T,
): GameboardEvent<T> {
  return {
    type,
    boardId,
    occurredAt: new Date().toISOString(),
    payload,
  }
}
