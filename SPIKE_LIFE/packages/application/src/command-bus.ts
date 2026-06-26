import type {
  DecisionStrategy,
  ReflectionAnswer,
  ScenarioId,
  SimulationRepository,
  SimulationState,
} from '@spike-life/domain'
import {
  startPlanningCycle,
  submitDecision,
  submitReflection,
} from '@spike-life/domain'

export interface StartCycleResult {
  sessionId: string
  scenarioId: ScenarioId
  phase: SimulationState['phase']
}

export class FinancialDecisionCommandBus {
  constructor(private readonly repository: SimulationRepository) {}

  async startCycle(
    sessionId: string,
    scenarioId: ScenarioId = 'promotion',
  ): Promise<StartCycleResult> {
    const session = startPlanningCycle(sessionId, scenarioId)
    await this.repository.save(session)
    return { sessionId: session.id, scenarioId: session.scenarioId, phase: session.phase }
  }

  /** @deprecated Use startCycle(sessionId, 'promotion') */
  async startPromotionCycle(sessionId: string): Promise<StartCycleResult> {
    return this.startCycle(sessionId, 'promotion')
  }

  async startProtectionStressCycle(sessionId: string): Promise<StartCycleResult> {
    return this.startCycle(sessionId, 'protection_stress')
  }

  async submitDecision(
    sessionId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = submitDecision(session, strategy, rationale)
    await this.repository.save(updated)
    return updated
  }

  /** @deprecated Use submitDecision */
  async submitPromotionDecision(
    sessionId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ): Promise<SimulationState> {
    return this.submitDecision(sessionId, strategy, rationale)
  }

  async submitReflection(
    sessionId: string,
    answers: ReflectionAnswer[],
  ): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = submitReflection(session, answers)
    await this.repository.save(updated)
    return updated
  }

  /** @deprecated Use submitReflection */
  async submitPromotionReflection(
    sessionId: string,
    answers: ReflectionAnswer[],
  ): Promise<SimulationState> {
    return this.submitReflection(sessionId, answers)
  }
}
