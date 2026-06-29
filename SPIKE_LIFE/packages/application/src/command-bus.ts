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
  advanceTurn as advanceTurnState,
  createWorkshopSession as createWorkshopSessionState,
  pickSoloArchetypeId,
  setDreamBoard as setDreamBoardState,
  resolveThirteenthMonthPay,
  dismissCalendarEvent as dismissCalendarEventState,
  applyAutoAdvisorDecision,
} from '@spike-life/domain'
import type { DreamBoardGoalChoice } from '@spike-life/domain'
import { DEFAULT_CURRENCY } from './content/bootstrap.js'

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
    const existing = await this.repository.findById(sessionId)
    const session = startPlanningCycle(sessionId, scenarioId, existing, DEFAULT_CURRENCY)
    await this.repository.save(session)
    return { sessionId: session.id, scenarioId: session.scenarioId, phase: session.phase }
  }

  async createWorkshopSession(sessionId: string): Promise<SimulationState> {
    const existing = await this.repository.findById(sessionId)
    if (existing) return existing

    const archetypeId = pickSoloArchetypeId(sessionId)
    const session = createWorkshopSessionState(sessionId, DEFAULT_CURRENCY, archetypeId)
    await this.repository.save(session)
    return session
  }

  async advanceTurn(sessionId: string): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = advanceTurnState(session)
    await this.repository.save(updated)
    return updated
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

  async setDreamBoard(
    sessionId: string,
    choices: DreamBoardGoalChoice[],
  ): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = setDreamBoardState(session, choices)
    await this.repository.save(updated)
    return updated
  }

  async resolveThirteenthMonth(
    sessionId: string,
    allocationId: string,
  ): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = resolveThirteenthMonthPay(session, allocationId)
    await this.repository.save(updated)
    return updated
  }

  async dismissCalendarEvent(sessionId: string): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = dismissCalendarEventState(session)
    await this.repository.save(updated)
    return updated
  }

  async applyAutoAdvisor(sessionId: string): Promise<SimulationState> {
    const session = await this.repository.findById(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const updated = applyAutoAdvisorDecision(session)
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
