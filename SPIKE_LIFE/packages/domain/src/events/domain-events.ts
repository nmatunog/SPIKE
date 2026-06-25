import type { DecisionStrategy } from '../types.js'

/** Domain events — bounded contexts communicate via events (Ch2). Not event sourcing. */
export const DomainEventType = {
  SIMULATION_STARTED: 'SimulationStarted',
  YEAR_ADVANCED: 'YearAdvanced',
  LIFE_STAGE_CHANGED: 'LifeStageChanged',
  LIFE_EVENT_APPLIED: 'LifeEventApplied',
  LIFE_EVENT_OCCURRED: 'LifeEventOccurred',
  DECISION_RECORDED: 'DecisionRecorded',
  FINANCIAL_PROFILE_UPDATED: 'FinancialProfileUpdated',
  PROTECTION_GAP_CHANGED: 'ProtectionGapChanged',
  GOAL_COMPLETED: 'GoalCompleted',
  FNA_SNAPSHOT_CREATED: 'FnaSnapshotCreated',
  LIFE_SCORE_UPDATED: 'LifeScoreUpdated',
  REFLECTION_GENERATED: 'ReflectionGenerated',
  SIMULATION_COMPLETED: 'SimulationCompleted',
} as const

export type DomainEventType = (typeof DomainEventType)[keyof typeof DomainEventType]

export interface DomainEvent<TPayload = unknown> {
  type: DomainEventType
  simulationId: string
  occurredAt: string
  payload: TPayload
}

export interface DecisionRecordedPayload {
  strategy: DecisionStrategy
  simulationYear?: number
}

export function createDomainEvent<T>(
  type: DomainEventType,
  simulationId: string,
  payload: T,
): DomainEvent<T> {
  return {
    type,
    simulationId,
    occurredAt: new Date().toISOString(),
    payload,
  }
}
