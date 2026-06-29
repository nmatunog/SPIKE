import type { SimulationState, DecisionRecord, TurnRecord } from './simulation-session.js'
import type { ScenarioId, CyclePhase, DecisionStrategy, SessionMode } from '../types.js'
import type { CurrencyConfig } from '@spike-life/content-core'
import type { DomainEvent } from '../events/domain-events.js'
import { DomainEventType, createDomainEvent } from '../events/domain-events.js'
import type { ReflectionAnswer } from '../services/reflection-engine.js'
import { createFreshGraduateBundle, FRESH_GRADUATE_FINANCIAL_PROFILE } from '../specifications/fresh-graduate.js'
import { createArchetypeBundle } from '../services/archetype-context.js'
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
  recordHiddenLongTermConsequence,
} from '../services/long-term-consequence-engine.js'
import {
  runReflectionEngine,
  validateReflectionAnswers,
} from '../services/reflection-engine.js'
import { calculateLifeScore } from '../services/life-score-engine.js'
import {
  WORKSHOP_MAX_TURNS,
  lifeStageForTurn,
  resolveWorkshopMaxTurns,
} from '../services/workshop-progression.js'
import {
  getDefaultDecisionTimerSeconds,
  getMaxCampaignCycles,
  getCampaignConfig,
} from '../services/campaign-context.js'
import {
  ageForCampaignYear,
  cycleIndexForMacroTurn,
  cyclesPerMacroTurn,
  formatCycleLabel,
  halfYearFromCycle,
  isYearEndCycle,
  simulationYearFromCycle,
} from '../services/planning-cycle.js'
import {
  advanceCyclePosition,
  completedCycleIndexForTurn,
  resolveMaxTurns,
} from '../services/session-mode.js'
import { allocationToStrategy, getAllocationById } from '../services/calendar-events.js'
import {
  buildDefaultDreamBoard,
  completeDreamBoard,
  dreamBoardToFinancialGoals,
  type DreamBoardGoalChoice,
} from '../services/dream-board.js'
import { autoAdvisorSelectStrategy } from '../services/auto-advisor.js'
import {
  buildAnnualCheckpoint,
  shouldTriggerThirteenthMonth,
  thirteenthMonthBonus,
} from '../services/calendar-events.js'
import { netWorth, monthlySurplus } from '../entities/financial-state.js'
import type { FinancialGoal } from '../entities/financial-state.js'

/** Core aggregate root — all simulation state changes pass through this class. */
export class Simulation {
  private state: SimulationState
  private uncommittedEvents: DomainEvent[] = []

  private constructor(state: SimulationState) {
    this.state = state
  }

  static createPromotion(id: string, currency: CurrencyConfig): Simulation {
    const bundle = createFreshGraduateBundle()
    return new Simulation(Simulation.emptyState(id, 'promotion', bundle, currency, 'campaign'))
  }

  static createCampaign(
    id: string,
    currency: CurrencyConfig,
    archetypeId?: string,
  ): Simulation {
    const bundle = createArchetypeBundle(archetypeId)
    return new Simulation(Simulation.emptyState(id, 'promotion', bundle, currency, 'campaign'))
  }

  static createWorkshop(
    id: string,
    currency: CurrencyConfig,
    archetypeId?: string,
    sessionMode: SessionMode = 'workshop_compressed',
  ): Simulation {
    const bundle = createArchetypeBundle(archetypeId)
    return new Simulation(Simulation.emptyState(id, 'promotion', bundle, currency, sessionMode))
  }

  static createProtectionStress(id: string, currency: CurrencyConfig): Simulation {
    const bundle = createProtectionStressBundle()
    return new Simulation(Simulation.emptyState(id, 'protection_stress', bundle, currency, 'campaign'))
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

  get turnNumber(): number {
    return this.state.turnNumber
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
      this.state.currency,
    )

    const fna = runFnaAnalysis(
      this.state.character,
      this.state.financialProfile,
      this.state.protectionPortfolio,
      this.state.goalPortfolio,
    )

    const recommendations = runRecommendationEngine(
      fna,
      this.state.character,
      this.state.currency,
    )

    this.state = {
      ...this.state,
      discovery,
      fnaBeforeDecision: fna,
      recommendations,
      phase: 'decision_pending',
      cycleDeadlineAt: this.state.decisionTimerSeconds > 0
        ? new Date(Date.now() + this.state.decisionTimerSeconds * 1000).toISOString()
        : null,
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
    if (!isValidDecisionStrategy(strategy, this.state.scenarioId, this.state.encounterId)) {
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
      source: rationale === 'auto_advisor' ? 'auto_advisor' : 'player',
    }

    this.state = {
      ...this.state,
      financialProfile: consequence.financialProfile,
      protectionPortfolio: consequence.protectionPortfolio,
      goalPortfolio: consequence.goalPortfolio,
      decision,
      consequence: consequenceWithDelta,
      fnaAfterDecision: fnaAfter,
      hiddenLongTermConsequences: recordHiddenLongTermConsequence(
        strategy,
        consequenceWithDelta.decisionQuality,
        this.state.simulationYear,
        this.state.hiddenLongTermConsequences ?? [],
      ),
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

  /** Select scenario for the current macro turn without resetting financial progress. */
  assignScenario(scenarioId: ScenarioId): Simulation {
    if (this.state.phase !== 'created') {
      throw new Error(
        `Cannot assign scenario in phase "${this.state.phase}". Advance turn or finish the active cycle first.`,
      )
    }
    this.state = {
      ...this.state,
      scenarioId,
      updatedAt: new Date().toISOString(),
    }
    return this
  }

  /**
   * Advance workshop macro turn after a completed planning cycle.
   * Preserves financial profile; clears micro-cycle state for the next mission.
   */
  advanceTurn(): Simulation {
    if (this.state.phase !== 'cycle_complete') {
      throw new Error(
        `Cannot advance turn in phase "${this.state.phase}". Complete reflection first.`,
      )
    }
    if (this.state.turnNumber >= this.state.maxTurns) {
      throw new Error('Simulation is already complete.')
    }

    const config = getCampaignConfig()
    const advanced = advanceCyclePosition(
      this.state.sessionMode,
      this.state.turnNumber,
      this.state.cycleIndex,
      config,
    )
    const endCycleIndex = completedCycleIndexForTurn(
      this.state.sessionMode,
      this.state.turnNumber,
      this.state.cycleIndex,
      config,
    )
    const completedYear = simulationYearFromCycle(endCycleIndex)

    const fna = this.state.fnaAfterDecision
    const lifeScore = fna
      ? calculateLifeScore(
          fna,
          this.state.financialProfile,
          this.state.consequence?.decisionQuality ?? null,
        )
      : null

    const completedTurn: TurnRecord = {
      turnNumber: this.state.turnNumber,
      simulationYear: this.state.simulationYear,
      cycleIndex: this.state.cycleIndex,
      halfYear: this.state.halfYear,
      lifeStage: this.state.character.lifeStage,
      scenarioId: this.state.scenarioId,
      completedAt: new Date().toISOString(),
      lifeScoreOverall: lifeScore?.overall ?? null,
    }

    const { turnNumber: nextTurn, cycleIndex, simulationYear, lifeStage: nextStage } = advanced
    const halfYear = halfYearFromCycle(cycleIndex)
    const nextAge = ageForCampaignYear(
      this.state.startingAge ?? this.state.character.age,
      simulationYear,
    )

    const fnaSnap = this.state.fnaAfterDecision
    const checkpoint = fnaSnap
      ? buildAnnualCheckpoint(
          completedYear,
          netWorth(this.state.financialProfile),
          monthlySurplus(this.state.financialProfile),
          fnaSnap.emergencyFundProgress,
          fnaSnap.protectionScore,
          fnaSnap.goalScore,
          lifeScore?.overall ?? 0,
        )
      : null

    const pendingCalendarEvent = shouldTriggerThirteenthMonth(
      completedYear,
      isYearEndCycle(endCycleIndex),
    )
      ? 'thirteenth_month'
      : null

    this.state = {
      ...this.state,
      turnNumber: nextTurn,
      cycleIndex,
      halfYear,
      simulationYear,
      character: {
        ...this.state.character,
        age: nextAge,
        lifeStage: nextStage,
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
      cycleDeadlineAt: null,
      pendingCalendarEvent,
      thirteenthMonthChoice: null,
      lastAnnualCheckpoint: checkpoint ?? this.state.lastAnnualCheckpoint,
      annualCheckpoints: checkpoint
        ? [...(this.state.annualCheckpoints ?? []), checkpoint]
        : (this.state.annualCheckpoints ?? []),
      turnHistory: [...this.state.turnHistory, completedTurn],
      updatedAt: new Date().toISOString(),
    }

    this.record(createDomainEvent(DomainEventType.YEAR_ADVANCED, this.state.id, {
      turnNumber: nextTurn,
      simulationYear,
      cycleIndex,
      halfYear,
      cycleLabel: formatCycleLabel(cycleIndex),
      age: nextAge,
    }))
    this.record(createDomainEvent(DomainEventType.LIFE_STAGE_CHANGED, this.state.id, {
      lifeStage: nextStage,
      turnNumber: nextTurn,
    }))

    return this
  }

  private applyPromotionSituation(): Simulation {
    const situation = createPromotionSituation(
      FRESH_GRADUATE_FINANCIAL_PROFILE,
      this.state.currency,
    )
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
    const situation = createProtectionStressSituation(
      PROTECTION_STRESS_FINANCIAL_PROFILE,
      this.state.currency,
    )
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

  /** Apply Life Blueprint choices before the first planning cycle. */
  setDreamBoard(choices: DreamBoardGoalChoice[]): Simulation {
    if (!this.state.dreamBoard) {
      throw new Error('Dream board not initialized.')
    }
    if (this.state.dreamBoard.completedAt) {
      throw new Error('Dream board is already complete.')
    }

    const board = completeDreamBoard({
      ...this.state.dreamBoard,
      goals: choices,
    })

    const funding = Object.fromEntries(
      this.state.goalPortfolio.goals.map((g) => [g.goalId, g.currentFunding]),
    )

    this.state = {
      ...this.state,
      dreamBoard: board,
      goalPortfolio: {
        goals: dreamBoardToFinancialGoals(board, funding),
      },
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  /** Resolve 13th month pay allocation — applies bonus to cash. */
  resolveThirteenthMonth(allocationId: string): Simulation {
    if (this.state.pendingCalendarEvent !== 'thirteenth_month') {
      throw new Error('No pending 13th month pay event.')
    }

    const allocation = getAllocationById(allocationId)
    const strategy = allocationToStrategy(allocation)
    const bonus = thirteenthMonthBonus(this.state.financialProfile)

    let profile = {
      ...this.state.financialProfile,
      cash: this.state.financialProfile.cash + bonus,
    }

    if (this.state.fnaBeforeDecision) {
      const consequence = runConsequenceEngine(
        profile,
        this.state.protectionPortfolio,
        this.state.goalPortfolio,
        strategy,
        bonus,
        this.state.fnaBeforeDecision,
        this.state.recommendations,
        this.state.scenarioId,
      )
      profile = consequence.financialProfile
      this.state = {
        ...this.state,
        financialProfile: profile,
        protectionPortfolio: consequence.protectionPortfolio,
        goalPortfolio: consequence.goalPortfolio,
        pendingCalendarEvent: 'annual_checkpoint',
        thirteenthMonthChoice: allocationId,
        updatedAt: new Date().toISOString(),
      }
    } else {
      this.state = {
        ...this.state,
        financialProfile: profile,
        pendingCalendarEvent: 'annual_checkpoint',
        thirteenthMonthChoice: allocationId,
        updatedAt: new Date().toISOString(),
      }
    }

    return this
  }

  dismissCalendarEvent(): Simulation {
    this.state = {
      ...this.state,
      pendingCalendarEvent: null,
      updatedAt: new Date().toISOString(),
    }
    return this
  }

  applyAutoAdvisorDecision(): Simulation {
    if (this.state.phase !== 'decision_pending') {
      throw new Error('No pending decision for auto-advisor.')
    }
    const strategy = autoAdvisorSelectStrategy(this.state.recommendations)
    return this.recordDecision(strategy, 'auto_advisor')
  }

  private record(event: DomainEvent): void {
    this.uncommittedEvents.push(event)
  }

  private static emptyState(
    id: string,
    scenarioId: ScenarioId,
    bundle: ReturnType<typeof createArchetypeBundle>,
    currency: CurrencyConfig,
    sessionMode: SessionMode = 'campaign',
  ): SimulationState {
    const now = new Date().toISOString()
    const maxTurns = resolveMaxTurns(sessionMode)
    const maxCycles = getMaxCampaignCycles()
    const dreamBoard = buildDefaultDreamBoard(
      bundle.character.age,
      bundle.financialProfile.monthlyIncome,
    )

    return {
      id,
      scenarioId,
      sessionMode,
      currency,
      startingAge: bundle.character.age,
      character: bundle.character,
      financialProfile: { ...bundle.financialProfile },
      protectionPortfolio: { ...bundle.protectionPortfolio },
      goalPortfolio: {
        goals: bundle.goalPortfolio.goals.map((g: FinancialGoal) => ({ ...g })),
      },
      phase: 'created',
      situation: null,
      selectedDomainId: null,
      encounterId: null,
      eventClass: null,
      domainHistory: [],
      advisorPausedUntil: null,
      discovery: null,
      fnaBeforeDecision: null,
      fnaAfterDecision: null,
      recommendations: [],
      decision: null,
      consequence: null,
      reflection: null,
      decisionMonthlyCapacity: 0,
      turnNumber: 1,
      cycleIndex: 1,
      halfYear: 'H1',
      simulationYear: 1,
      maxTurns,
      maxCycles,
      dreamBoard,
      decisionTimerSeconds: getDefaultDecisionTimerSeconds(),
      cycleDeadlineAt: null,
      pendingCalendarEvent: null,
      thirteenthMonthChoice: null,
      lastAnnualCheckpoint: null,
      annualCheckpoints: [],
      turnHistory: [],
      hiddenLongTermConsequences: [],
      createdAt: now,
      updatedAt: now,
    }
  }
}
