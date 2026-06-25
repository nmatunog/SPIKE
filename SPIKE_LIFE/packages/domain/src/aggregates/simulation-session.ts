import type { Character, FinancialProfile, GoalPortfolio, ProtectionPortfolio } from '../entities/financial-state.js'
import type { CyclePhase, DecisionStrategy } from '../types.js'
import type { ConsequenceOutcome } from '../engines/consequence-engine.js'
import type { DiscoverySnapshot } from '../engines/discovery-engine.js'
import type { FnaSnapshot } from '../engines/fna-engine.js'
import type { Recommendation } from '../engines/recommendation-engine.js'
import type { ReflectionSnapshot } from '../engines/reflection-engine.js'
import type { SituationSnapshot } from '../engines/situation-engine.js'

export interface DecisionRecord {
  strategy: DecisionStrategy
  recordedAt: string
  monthlyRaiseApplied: number
  rationale?: string
}

export interface SimulationSession {
  id: string
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
  promotionMonthlyRaise: number
  createdAt: string
  updatedAt: string
}

export interface SimulationSessionSnapshot {
  session: SimulationSession
  fna: FnaSnapshot | null
  recommendations: Recommendation[]
}
