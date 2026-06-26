import type {
  DecisionStrategy,
  ReflectionAnswer,
  SimulationRepository,
  SimulationSession,
} from '@spike-life/domain'
import {
  completeDiscovery,
  createPromotionSession,
  presentPromotionSituation,
  submitDecision,
  submitReflection,
} from '@spike-life/domain'

export interface StartPromotionCycleResult {
  sessionId: string
  phase: SimulationSession['phase']
}

export class FinancialDecisionCommandBus {
  constructor(private readonly repository: SimulationRepository) {}

  async startPromotionCycle(sessionId: string): Promise<StartPromotionCycleResult> {
    let session = createPromotionSession(sessionId)
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)
    await this.repository.save(session)
    return { sessionId: session.id, phase: session.phase }
  }

  async submitPromotionDecision(
    sessionId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ): Promise<SimulationSession> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = submitDecision(session, strategy, rationale)
    await this.repository.save(updated)
    return updated
  }

  async submitPromotionReflection(
    sessionId: string,
    answers: ReflectionAnswer[],
  ): Promise<SimulationSession> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = submitReflection(session, answers)
    await this.repository.save(updated)
    return updated
  }
}
