import { describe, expect, it } from 'vitest'
import { runConsequenceEngine } from './consequence-engine.js'
import { runFnaAnalysis } from './fna-engine.js'
import { runRecommendationEngine } from './recommendation-engine.js'
import { FRESH_GRADUATE_FINANCIAL_PROFILE } from '../specifications/fresh-graduate.js'
import { createFreshGraduateBundle } from '../specifications/fresh-graduate.js'

import { TEST_CURRENCY } from '../test/currency-fixture.js'

describe('consequence-engine goal routing', () => {
  const bundle = createFreshGraduateBundle()
  const fna = runFnaAnalysis(
    bundle.character,
    bundle.financialProfile,
    bundle.protectionPortfolio,
    bundle.goalPortfolio,
  )
  const recommendations = runRecommendationEngine(fna, bundle.character, TEST_CURRENCY)

  it('fund_goals advances dream goals before topping up emergency fund', () => {
    const outcome = runConsequenceEngine(
      bundle.financialProfile,
      bundle.protectionPortfolio,
      bundle.goalPortfolio,
      'fund_goals',
      5_000,
      fna,
      recommendations,
      'promotion',
    )

    const emergency = outcome.goalPortfolio.goals.find((g) => g.goalId === 'emergency_fund')
    const travel = outcome.goalPortfolio.goals.find((g) => g.goalId === 'travel')
    const beforeTravel = bundle.goalPortfolio.goals.find((g) => g.goalId === 'travel')

    expect(travel!.currentFunding).toBeGreaterThan(beforeTravel!.currentFunding)
    expect(emergency!.currentFunding).toBeGreaterThanOrEqual(
      bundle.goalPortfolio.goals.find((g) => g.goalId === 'emergency_fund')!.currentFunding,
    )
  })

  it('increase_lifestyle does not advance emergency fund goals', () => {
    const outcome = runConsequenceEngine(
      bundle.financialProfile,
      bundle.protectionPortfolio,
      bundle.goalPortfolio,
      'increase_lifestyle',
      5_000,
      fna,
      recommendations,
      'promotion',
    )

    const emergency = outcome.goalPortfolio.goals.find((g) => g.goalId === 'emergency_fund')
    const beforeEmergency = bundle.goalPortfolio.goals.find((g) => g.goalId === 'emergency_fund')

    expect(emergency!.currentFunding).toBe(beforeEmergency!.currentFunding)
    expect(outcome.financialProfile.monthlyExpenses).toBeGreaterThan(
      bundle.financialProfile.monthlyExpenses,
    )
  })

  it('split_allocation distributes across emergency fund and dream goals', () => {
    const outcome = runConsequenceEngine(
      FRESH_GRADUATE_FINANCIAL_PROFILE,
      bundle.protectionPortfolio,
      bundle.goalPortfolio,
      'split_allocation',
      4_000,
      fna,
      recommendations,
      'promotion',
    )

    const travel = outcome.goalPortfolio.goals.find((g) => g.goalId === 'travel')
    const beforeTravel = bundle.goalPortfolio.goals.find((g) => g.goalId === 'travel')
    expect(travel!.currentFunding).toBeGreaterThan(beforeTravel!.currentFunding)
  })
})
