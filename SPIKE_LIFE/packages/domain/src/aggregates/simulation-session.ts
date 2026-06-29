import type { CurrencyConfig } from '@spike-life/content-core'
import type { HiddenLongTermConsequence } from '../services/long-term-consequence-engine.js'
import type { CyclePhase, DecisionStrategy, LifeStage, ScenarioId, SessionMode, EventClass } from '../types.js'
import type { ConsequenceOutcome } from '../services/consequence-engine.js'
import type { DiscoverySnapshot } from '../services/discovery-engine.js'
import type { FnaSnapshot } from '../services/fna-engine.js'
import type { Recommendation } from '../services/recommendation-engine.js'
import type { ReflectionSnapshot } from '../services/reflection-engine.js'
import type { SituationSnapshot } from '../services/situation-engine.js'
import type { Character, FinancialProfile, GoalPortfolio, ProtectionPortfolio } from '../entities/financial-state.js'
import type { DreamBoardState } from '../services/dream-board.js'
import type { AnnualCheckpointSnapshot, PendingCalendarEvent } from '../services/calendar-events.js'
import type { HalfYear } from '../services/planning-cycle.js'

export interface DecisionRecord {
  strategy: DecisionStrategy
  recordedAt: string
  monthlyCapacityApplied: number
  rationale?: string
  source?: 'player' | 'auto_advisor'
}

/** Completed macro turn — preserved when advancing the workshop board. */
export interface TurnRecord {
  turnNumber: number
  simulationYear: number
  cycleIndex: number
  halfYear: HalfYear
  lifeStage: LifeStage
  scenarioId: ScenarioId
  completedAt: string
  lifeScoreOverall: number | null
}

/** Serializable simulation state — persistence and read-model projections use this shape. */
export interface SimulationState {
  id: string
  scenarioId: ScenarioId
  sessionMode: SessionMode
  /** Active content-pack currency — drives display formatting in narratives and projections. */
  currency: CurrencyConfig
  /** Age at turn 1 — increments +1 each year (Amendment A5 v1.1). */
  startingAge: number
  character: Character
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
  phase: CyclePhase
  situation: SituationSnapshot | null
  selectedDomainId: string | null
  encounterId: string | null
  eventClass: EventClass | null
  domainHistory: string[]
  advisorPausedUntil: string | null
  discovery: DiscoverySnapshot | null
  fnaBeforeDecision: FnaSnapshot | null
  fnaAfterDecision: FnaSnapshot | null
  recommendations: Recommendation[]
  decision: DecisionRecord | null
  consequence: ConsequenceOutcome | null
  reflection: ReflectionSnapshot | null
  /** Monthly raise (promotion) or protection-planning capacity (protection stress). */
  decisionMonthlyCapacity: number
  /** Workshop macro turn (1–5). One turn = compressed multi-cycle chapter. */
  turnNumber: number
  /** Semi-annual planning cycle index (1–20 in full campaign). */
  cycleIndex: number
  halfYear: HalfYear
  simulationYear: number
  maxTurns: number
  maxCycles: number
  /** Life Blueprint — player goals before simulation (Phase 2). */
  dreamBoard: DreamBoardState | null
  /** Decision timer — seconds; 0 = off. */
  decisionTimerSeconds: number
  /** ISO timestamp when decision window closes. */
  cycleDeadlineAt: string | null
  pendingCalendarEvent: PendingCalendarEvent
  thirteenthMonthChoice: string | null
  lastAnnualCheckpoint: AnnualCheckpointSnapshot | null
  annualCheckpoints: AnnualCheckpointSnapshot[]
  turnHistory: TurnRecord[]
  /** Recorded each decision; revealed when simulation year catches up (Amendment A5). */
  hiddenLongTermConsequences: HiddenLongTermConsequence[]
  createdAt: string
  updatedAt: string
}

/** @deprecated Use SimulationState — kept for backward compatibility during migration. */
export type SimulationSession = SimulationState

export interface SimulationSessionSnapshot {
  session: SimulationState
  fna: FnaSnapshot | null
  recommendations: Recommendation[]
}
