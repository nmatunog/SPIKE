import type { DecisionStrategy } from '../types.js'
import type { Recommendation } from './recommendation-engine.js'

const STRATEGY_PRIORITY: DecisionStrategy[] = [
  'increase_savings',
  'improve_protection',
  'fund_goals',
  'reduce_debt',
  'maintain_lifestyle_discipline',
  'split_allocation',
  'increase_lifestyle',
]

/** Conservative advisor pick when the decision timer expires — not random. */
export function autoAdvisorSelectStrategy(
  recommendations: Recommendation[],
): DecisionStrategy {
  if (recommendations.length > 0) {
    const top = recommendations[0]
    const mapped = recommendationToStrategy(top?.addressesGap ?? '')
    if (mapped) return mapped
  }
  return 'maintain_lifestyle_discipline'
}

function recommendationToStrategy(addressesGap: string): DecisionStrategy | null {
  const gap = addressesGap.toLowerCase()
  if (gap.includes('cash') || gap.includes('emergency')) return 'increase_savings'
  if (gap.includes('protection') || gap.includes('health')) return 'improve_protection'
  if (gap.includes('goal') || gap.includes('education')) return 'fund_goals'
  if (gap.includes('debt')) return 'reduce_debt'
  if (gap.includes('retirement')) return 'fund_goals'
  return null
}

export function pickConservativeStrategy(
  options: DecisionStrategy[],
): DecisionStrategy {
  for (const strategy of STRATEGY_PRIORITY) {
    if (options.includes(strategy)) return strategy
  }
  return options[0] ?? 'maintain_lifestyle_discipline'
}
