import type { SimulationState, DecisionRecord } from './simulation-session.js'
import type { ScenarioId, CyclePhase, DecisionStrategy } from '../types.js'
import type { DomainEvent } from '../events/domain-events.js'
import { DomainEventType, createDomainEvent } from '../events/domain-events.js'
import type { ReflectionAnswer } from '../services/reflection-engine.js'
import { createFreshGraduateBundle, FRESH_GRADUATE_FINANCIAL_PROFILE } from '../specifications/fresh-graduate.js'
import {
  createProtectionStressBundle,
  PROTECTION_STRESS_FINANCIAL_PROFILE,
} from '../specifications/protection-stress.js'
import {
  applyProtectionStressToProfile,
  applySituationToIncome,
  createPromotionSituation,
  createProtectionStressSituation,
  monthlyRaiseFromSituation,
  protectionDecisionCapacity,
} from '../services/situation-engine.js'
import { runDiscovery } from '../services/discovery-engine.js'
import { runFnaAnalysis } from '../services/fna-engine.js'
import { runRecommendationEngine } from '../services/recommendation-engine.js'
import { isValidDecisionStrategy } from '../services/decision-engine.js'
import {
  attachFnaScoreDelta,
  runConsequenceEngine,
} from '../services/consequence-engine.js'
import {
  runReflectionEngine,
  validateReflectionAnswers,
} from '../services/reflection-engine.js'
import { calculateLifeScore } from '../services/life-score-engine.js'
import type { FinancialGoal } from '../entities/financial-state.js'

/** Core aggregate root — all simulation state changes pass through this class. */
export class Simulation {
  private state: SimulationState
  private uncommittedEvents: DomainEvent[] = []

  private constructor(state: SimulationState) {
    this.state = state
  }

  static createPromotion(id: string): Simulation {
    const bundle = createFreshGraduateBundle()
    return new Simulation(Simulation.emptyState(id, 'promotion', bundle))
  }

  static createProtectionStress(id: string): Simulation {
    const bundle = createProtectionStressBundle()
    return new Simulation(Simulation.emptyState(id, 'protection_stress', bundle))
  }

  static fromState(state: SimulationState): Simulation {
    return new Simulation(structuredClone(state))
  }

  get id(): string {
    return this.state.id
  }

  get scenarioId(): ScenarioId {
    return this.state.scenarioId
  }

  get phase(): CyclePhase {
    return this.state.phase
  }

  toState(): SimulationState {
    return structuredClone(this.state)
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.uncommittedEvents]
    this.uncommittedEvents = []
    return events
  }

  presentSituation(): Simulation {
    if (this.state.scenarioId === 'promotion') {
      return this.applyPromotionSituation()
    }
    return this.applyProtectionStressSituation()
  }

  completeDiscovery(): Simulation {
    if (!this.state.situation) {
      throw new Error('Cannot run discovery without a presented situation.')
    }

    const discovery = runDiscovery(
      this.state.character,
      this.state.financialProfile,
      this.state.protectionPortfolio,
      this.state.goalPortfolio,
      this.state.situation,
    )

    const fna = runFnaAnalysis(
      this.state.character,
      this.state.financialProfile,
      this.state.protectionPortfolio,
      this.state.goalPortfolio,
    )

    const recommendations = runRecommendationEngine(fna, this.state.character)

    this.state = {
      ...this.state,
      discovery,
      fnaBeforeDecision: fna,
      recommendations,
      phase: 'decision_pending',
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(
      DomainEventType.FNA_SNAPSHOT_CREATED,
      this.state.id,
      { timing: 'before_decision', overallScore: fna.overallScore },
    ))

    return this
  }

  recordDecision(strategy: DecisionStrategy, rationale?: string): Simulation {
    if (this.state.phase !== 'decision_pending') {
      throw new Error(`Cannot submit decision in phase "${this.state.phase}".`)
    }
    if (!isValidDecisionStrategy(strategy, this.state.scenarioId)) {
      throw new Error(`Invalid decision strategy: ${strategy}`)
    }
    if (!this.state.fnaBeforeDecision) {
      throw new Error('FNA must be computed before decision.')
    }

    const consequence = runConsequenceEngine(
      this.state.financialProfile,
      this.state.protectionPortfolio,
      this.state.goalPortfolio,
      strategy,
      this.state.decisionMonthlyCapacity,
      this.state.fnaBeforeDecision,
      this.state.recommendations,
      this.state.scenarioId,
    )

    const fnaAfter = runFnaAnalysis(
      this.state.character,
      consequence.financialProfile,
      consequence.protectionPortfolio,
      consequence.goalPortfolio,
    )

    const consequenceWithDelta = attachFnaScoreDelta(
      consequence,
      this.state.fnaBeforeDecision,
      fnaAfter,
    )

    const decision: DecisionRecord = {
      strategy,
      recordedAt: new Date().toISOString(),
      monthlyCapacityApplied: this.state.decisionMonthlyCapacity,
      rationale,
    }

    this.state = {
      ...this.state,
      financialProfile: consequence.financialProfile,
      protectionPortfolio: consequence.protectionPortfolio,
      goalPortfolio: consequence.goalPortfolio,
      decision,
      consequence: consequenceWithDelta,
      fnaAfterDecision: fnaAfter,
      phase: 'consequences_applied',
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(DomainEventType.DECISION_RECORDED, this.state.id, {
      strategy,
      scenarioId: this.state.scenarioId,
    }))
    this.record(createDomainEvent(DomainEventType.FINANCIAL_PROFILE_UPDATED, this.state.id, {}))
    this.record(createDomainEvent(
      DomainEventType.PROTECTION_GAP_CHANGED,
      this.state.id,
      { protectionScoreAfter: fnaAfter.protectionScore },
    ))

    const lifeScore = calculateLifeScore(
      fnaAfter,
      consequence.financialProfile,
      consequence.decisionQuality,
    )
    this.record(createDomainEvent(DomainEventType.LIFE_SCORE_UPDATED, this.state.id, {
      overall: lifeScore.overall,
    }))

    return this
  }

  completeReflection(answers: ReflectionAnswer[]): Simulation {
    if (this.state.phase !== 'consequences_applied') {
      throw new Error(`Cannot submit reflection in phase "${this.state.phase}".`)
    }
    if (
      !this.state.decision
      || !this.state.consequence
      || !this.state.fnaBeforeDecision
      || !this.state.fnaAfterDecision
    ) {
      throw new Error('Decision and consequences required before reflection.')
    }
    if (!validateReflectionAnswers(answers)) {
      throw new Error('At least three reflection answers with meaningful content are required.')
    }

    const reflection = runReflectionEngine(
      this.state.decision.strategy,
      this.state.consequence,
      this.state.fnaBeforeDecision,
      this.state.fnaAfterDecision,
      this.state.recommendations,
      answers,
    )

    this.state = {
      ...this.state,
      reflection: { ...reflection, completedAt: new Date().toISOString() },
      phase: 'cycle_complete',
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(DomainEventType.REFLECTION_GENERATED, this.state.id, {}))
    this.record(createDomainEvent(DomainEventType.SIMULATION_COMPLETED, this.state.id, {
      scenarioId: this.state.scenarioId,
    }))

    return this
  }

  private applyPromotionSituation(): Simulation {
    const situation = createPromotionSituation(FRESH_GRADUATE_FINANCIAL_PROFILE)
    const profileAfter = applySituationToIncome(this.state.financialProfile, situation)
    const monthlyCapacity = monthlyRaiseFromSituation(this.state.financialProfile, situation)

    this.state = {
      ...this.state,
      financialProfile: profileAfter,
      situation,
      decisionMonthlyCapacity: monthlyCapacity,
      phase: 'situation_presented',
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(DomainEventType.LIFE_EVENT_APPLIED, this.state.id, {
      eventId: situation.eventId,
    }))

    return this
  }

  private applyProtectionStressSituation(): Simulation {
    const situation = createProtectionStressSituation(PROTECTION_STRESS_FINANCIAL_PROFILE)
    const profileAfter = applyProtectionStressToProfile(this.state.financialProfile, situation)
    const monthlyCapacity = protectionDecisionCapacity(profileAfter)

    this.state = {
      ...this.state,
      financialProfile: profileAfter,
      situation,
      decisionMonthlyCapacity: monthlyCapacity,
      phase: 'situation_presented',
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(DomainEventType.LIFE_EVENT_APPLIED, this.state.id, {
      eventId: situation.eventId,
    }))
    this.record(createDomainEvent(DomainEventType.LIFE_EVENT_OCCURRED, this.state.id, {
      title: situation.title,
    }))

    return this
  }

  private record(event: DomainEvent): void {
    this.uncommittedEvents.push(event)
  }

  private static emptyState(
    id: string,
    scenarioId: ScenarioId,
    bundle: ReturnType<typeof createFreshGraduateBundle>,
  ): SimulationState {
    const now = new Date().toISOString()
    return {
      id,
      scenarioId,
      character: bundle.character,
      financialProfile: { ...bundle.financialProfile },
      protectionPortfolio: { ...bundle.protectionPortfolio },
      goalPortfolio: {
        goals: bundle.goalPortfolio.goals.map((g: FinancialGoal) => ({ ...g })),
      },
      phase: 'created',
      situation: null,
      discovery: null,
      fnaBeforeDecision: null,
      fnaAfterDecision: null,
      recommendations: [],
      decision: null,
      consequence: null,
      reflection: null,
      decisionMonthlyCapacity: 0,
      createdAt: now,
      updatedAt: now,
    }
  }
}
