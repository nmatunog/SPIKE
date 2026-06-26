import { describe, expect, it } from 'vitest'
import {
  createPromotionSession,
  presentPromotionSituation,
  completeDiscovery,
  submitDecision,
  submitReflection,
  runPromotionPlanningCycle,
  runFnaAnalysis,
  PROMOTION_INCOME_MULTIPLIER,
  SolutionCategory,
} from './index.js'

const SAMPLE_REFLECTION = [
  { promptId: 'what_happened', response: 'My savings grew and protection improved slightly.' },
  { promptId: 'why_happened', response: 'I chose discipline over lifestyle inflation.' },
  { promptId: 'what_worked', response: 'Following FNA priorities before acting on the raise.' },
  { promptId: 'what_change', response: 'I would allocate more to protection earlier.' },
  { promptId: 'advise_other', response: 'Run FNA first — a raise is not free money.' },
]

describe('Promotion Financial Decision Cycle', () => {
  it('applies +15% income on promotion situation', () => {
    let session = createPromotionSession('test-1')
    const incomeBefore = session.financialProfile.monthlyIncome
    session = presentPromotionSituation(session)

    expect(session.financialProfile.monthlyIncome).toBe(
      Math.round(incomeBefore * PROMOTION_INCOME_MULTIPLIER),
    )
    expect(session.situation?.eventId).toBe('C001_promotion')
    expect(session.decisionMonthlyCapacity).toBeGreaterThan(0)
  })

  it('runs discovery and produces FNA before decision', () => {
    let session = createPromotionSession('test-2')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)

    expect(session.phase).toBe('decision_pending')
    expect(session.discovery?.observations.length).toBeGreaterThanOrEqual(6)
    expect(session.fnaBeforeDecision).not.toBeNull()
    expect(session.fnaBeforeDecision!.overallScore).toBeGreaterThan(0)
    expect(session.recommendations.length).toBeGreaterThan(0)
  })

  it('recommends emergency fund before lifestyle for fresh graduate after promotion', () => {
    let session = createPromotionSession('test-3')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)

    const top = session.recommendations[0]
    expect(top?.solution).toBe(SolutionCategory.BUILD_EMERGENCY_FUND)
    expect(top?.rank).toBe(1)
  })

  it('never recommends insurance products — only solution categories', () => {
    let session = createPromotionSession('test-4')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)

    for (const rec of session.recommendations) {
      expect(rec.label.toLowerCase()).not.toContain('buy ')
      expect(rec.label.toLowerCase()).not.toContain('insurance')
    }
  })

  it('produces deterministic consequences for maintain_lifestyle_discipline', () => {
    let session = createPromotionSession('test-5')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)
    const cashBefore = session.financialProfile.cash
    session = submitDecision(session, 'maintain_lifestyle_discipline')

    expect(session.phase).toBe('consequences_applied')
    expect(session.financialProfile.cash).toBeGreaterThan(cashBefore)
    expect(session.fnaAfterDecision!.overallScore).toBeGreaterThanOrEqual(
      session.fnaBeforeDecision!.overallScore,
    )
    expect(session.consequence?.decisionQuality).not.toBe('high_risk')
  })

  it('flags lifestyle increase as high risk when emergency fund is low', () => {
    let session = createPromotionSession('test-6')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)
    session = submitDecision(session, 'increase_lifestyle')

    expect(session.consequence?.decisionQuality).toBe('high_risk')
    expect(session.fnaAfterDecision!.cashFlowScore).toBeLessThanOrEqual(
      session.fnaBeforeDecision!.cashFlowScore,
    )
  })

  it('completes full cycle through reflection', () => {
    const session = runPromotionPlanningCycle(
      'test-7',
      'maintain_lifestyle_discipline',
      SAMPLE_REFLECTION,
    )

    expect(session.phase).toBe('cycle_complete')
    expect(session.reflection?.completedAt).not.toBeNull()
    expect(session.reflection?.advisorInsight).toContain('recommendation')
  })

  it('FNA engine is deterministic for identical inputs', () => {
    let session = createPromotionSession('test-8')
    session = presentPromotionSituation(session)
    session = completeDiscovery(session)

    const a = runFnaAnalysis(
      session.character,
      session.financialProfile,
      session.protectionPortfolio,
      session.goalPortfolio,
    )
    const b = runFnaAnalysis(
      session.character,
      session.financialProfile,
      session.protectionPortfolio,
      session.goalPortfolio,
    )

    expect(a.overallScore).toBe(b.overallScore)
    expect(a.topPriority).toBe(b.topPriority)
  })
})
