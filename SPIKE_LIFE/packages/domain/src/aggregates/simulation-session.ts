import type { CyclePhase, DecisionStrategy, ScenarioId } from '../types.js'
import type { ConsequenceOutcome } from '../services/consequence-engine.js'
import type { DiscoverySnapshot } from '../services/discovery-engine.js'
import type { FnaSnapshot } from '../services/fna-engine.js'
import type { Recommendation } from '../services/recommendation-engine.js'
import type { ReflectionSnapshot } from '../services/reflection-engine.js'
import type { SituationSnapshot } from '../services/situation-engine.js'
import type { Character, FinancialProfile, GoalPortfolio, ProtectionPortfolio } from '../entities/financial-state.js'

export interface DecisionRecord {
  strategy: DecisionStrategy
  recordedAt: string
  monthlyCapacityApplied: number
  rationale?: string
}

/** Serializable simulation state — persistence and read-model projections use this shape. */
export interface SimulationState {
  id: string
  scenarioId: ScenarioId
  character: Character
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
  phase: CyclePhase
  situation: SituationSnapshot | null
  discovery: DiscoverySnapshot | null
  fnaBeforeDecision: FnaSnapshot | null
  fnaAfterDecision: FnaSnapshot | null
  recommendations: Recommendation[]
  decision: DecisionRecord | null
  consequence: ConsequenceOutcome | null
  reflection: ReflectionSnapshot | null
  /** Monthly raise (promotion) or protection-planning capacity (protection stress). */
  decisionMonthlyCapacity: number
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
