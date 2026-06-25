import type { SimulationSession } from './aggregates/simulation-session.js'
import type { FinancialGoal } from './entities/financial-state.js'
import { createFreshGraduateBundle } from './scenarios/fresh-graduate.js'
import {
  applySituationToIncome,
  createPromotionSituation,
  monthlyRaiseFromSituation,
} from './engines/situation-engine.js'
import { runDiscovery } from './engines/discovery-engine.js'
import { runFnaAnalysis } from './engines/fna-engine.js'
import { runRecommendationEngine } from './engines/recommendation-engine.js'
import {
  attachFnaScoreDelta,
  runConsequenceEngine,
} from './engines/consequence-engine.js'
import {
  runReflectionEngine,
  validateReflectionAnswers,
  type ReflectionAnswer,
} from './engines/reflection-engine.js'
import { isValidDecisionStrategy } from './engines/decision-engine.js'
import type { DecisionStrategy } from './types.js'
import { FRESH_GRADUATE_FINANCIAL_PROFILE } from './scenarios/fresh-graduate.js'

export function createPromotionSession(sessionId: string): SimulationSession {
  const bundle = createFreshGraduateBundle()
  const now = new Date().toISOString()

  return {
    id: sessionId,
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
    promotionMonthlyRaise: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function presentPromotionSituation(session: SimulationSession): SimulationSession {
  const situation = createPromotionSituation(FRESH_GRADUATE_FINANCIAL_PROFILE)
  const profileAfterSituation = applySituationToIncome(session.financialProfile, situation)
  const monthlyRaise = monthlyRaiseFromSituation(session.financialProfile, situation)

  return {
    ...session,
    financialProfile: profileAfterSituation,
    situation,
    promotionMonthlyRaise: monthlyRaise,
    phase: 'situation_presented',
    updatedAt: new Date().toISOString(),
  }
}

export function completeDiscovery(session: SimulationSession): SimulationSession {
  if (!session.situation) {
    throw new Error('Cannot run discovery without a presented situation.')
  }

  const discovery = runDiscovery(
    session.character,
    session.financialProfile,
    session.protectionPortfolio,
    session.goalPortfolio,
    session.situation,
  )

  const fna = runFnaAnalysis(
    session.character,
    session.financialProfile,
    session.protectionPortfolio,
    session.goalPortfolio,
  )

  const recommendations = runRecommendationEngine(fna, session.character)

  return {
    ...session,
    discovery,
    fnaBeforeDecision: fna,
    recommendations,
    phase: 'decision_pending',
    updatedAt: new Date().toISOString(),
  }
}

export function submitDecision(
  session: SimulationSession,
  strategy: DecisionStrategy,
  rationale?: string,
): SimulationSession {
  if (session.phase !== 'decision_pending') {
    throw new Error(`Cannot submit decision in phase "${session.phase}".`)
  }
  if (!isValidDecisionStrategy(strategy)) {
    throw new Error(`Invalid decision strategy: ${strategy}`)
  }
  if (!session.fnaBeforeDecision) {
    throw new Error('FNA must be computed before decision.')
  }

  const consequence = runConsequenceEngine(
    session.financialProfile,
    session.protectionPortfolio,
    session.goalPortfolio,
    strategy,
    session.promotionMonthlyRaise,
    session.fnaBeforeDecision,
    session.recommendations,
  )

  const fnaAfter = runFnaAnalysis(
    session.character,
    consequence.financialProfile,
    consequence.protectionPortfolio,
    consequence.goalPortfolio,
  )

  const consequenceWithDelta = attachFnaScoreDelta(
    consequence,
    session.fnaBeforeDecision,
    fnaAfter,
  )

  return {
    ...session,
    financialProfile: consequence.financialProfile,
    protectionPortfolio: consequence.protectionPortfolio,
    goalPortfolio: consequence.goalPortfolio,
    decision: {
      strategy,
      recordedAt: new Date().toISOString(),
      monthlyRaiseApplied: session.promotionMonthlyRaise,
      rationale,
    },
    consequence: consequenceWithDelta,
    fnaAfterDecision: fnaAfter,
    phase: 'consequences_applied',
    updatedAt: new Date().toISOString(),
  }
}

export function submitReflection(
  session: SimulationSession,
  answers: ReflectionAnswer[],
): SimulationSession {
  if (session.phase !== 'consequences_applied') {
    throw new Error(`Cannot submit reflection in phase "${session.phase}".`)
  }
  if (!session.decision || !session.consequence || !session.fnaBeforeDecision || !session.fnaAfterDecision) {
    throw new Error('Decision and consequences required before reflection.')
  }
  if (!validateReflectionAnswers(answers)) {
    throw new Error('At least three reflection answers with meaningful content are required.')
  }

  const reflection = runReflectionEngine(
    session.decision.strategy,
    session.consequence,
    session.fnaBeforeDecision,
    session.fnaAfterDecision,
    session.recommendations,
    answers,
  )

  return {
    ...session,
    reflection: { ...reflection, completedAt: new Date().toISOString() },
    phase: 'cycle_complete',
    updatedAt: new Date().toISOString(),
  }
}

/** Runs the full Promotion planning cycle (for tests and validation). */
export function runPromotionPlanningCycle(
  sessionId: string,
  strategy: DecisionStrategy,
  reflectionAnswers: ReflectionAnswer[],
): SimulationSession {
  let session = createPromotionSession(sessionId)
  session = presentPromotionSituation(session)
  session = completeDiscovery(session)
  session = submitDecision(session, strategy)
  session = submitReflection(session, reflectionAnswers)
  return session
}
