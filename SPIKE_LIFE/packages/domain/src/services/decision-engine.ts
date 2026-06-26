import type { DecisionStrategy, ScenarioId } from '../types.js'

export interface DecisionOption {
  strategy: DecisionStrategy
  label: string
  description: string
  alignsWithSolutions: string[]
}

export const PROMOTION_DECISION_OPTIONS: DecisionOption[] = [
  {
    strategy: 'increase_lifestyle',
    label: 'Increase Lifestyle',
    description: 'Allocate most of the raise toward higher spending.',
    alignsWithSolutions: [],
  },
  {
    strategy: 'increase_savings',
    label: 'Increase Savings',
    description: 'Direct the raise toward cash reserves and emergency fund.',
    alignsWithSolutions: ['Build Emergency Fund'],
  },
  {
    strategy: 'reduce_debt',
    label: 'Reduce Debt',
    description: 'Use the raise to pay down outstanding liabilities.',
    alignsWithSolutions: ['Reduce Unsustainable Debt'],
  },
  {
    strategy: 'improve_protection',
    label: 'Improve Protection',
    description: 'Strengthen protection plans while income is higher.',
    alignsWithSolutions: [
      'Strengthen Health Protection Plan',
      'Protect Your Income',
    ],
  },
  {
    strategy: 'fund_goals',
    label: 'Fund Goals',
    description: 'Accelerate progress toward active financial goals.',
    alignsWithSolutions: ['Accelerate Goal Funding'],
  },
  {
    strategy: 'split_allocation',
    label: 'Split Allocation',
    description: 'Balance savings, protection, and goals from the raise.',
    alignsWithSolutions: ['Build Emergency Fund', 'Accelerate Goal Funding'],
  },
  {
    strategy: 'maintain_lifestyle_discipline',
    label: 'Maintain Lifestyle Discipline',
    description: 'Keep expenses steady and deploy the full raise toward planning priorities.',
    alignsWithSolutions: ['Maintain Lifestyle Discipline', 'Build Emergency Fund'],
  },
]

export const PROTECTION_STRESS_DECISION_OPTIONS: DecisionOption[] = [
  {
    strategy: 'improve_protection',
    label: 'Strengthen Protection Plans',
    description: 'Fund Family, Health, and Income Protection Plans per FNA priorities.',
    alignsWithSolutions: [
      'Strengthen Family Protection Plan',
      'Strengthen Health Protection Plan',
      'Protect Your Income',
    ],
  },
  {
    strategy: 'split_allocation',
    label: 'Balance Protection and Savings',
    description: 'Improve protection readiness while preserving part of the emergency fund.',
    alignsWithSolutions: ['Strengthen Health Protection Plan', 'Build Emergency Fund'],
  },
  {
    strategy: 'increase_savings',
    label: 'Rebuild Emergency Fund Only',
    description: 'Focus on cash reserves without improving protection plans.',
    alignsWithSolutions: ['Build Emergency Fund'],
  },
  {
    strategy: 'reduce_debt',
    label: 'Reduce Debt First',
    description: 'Pay down liabilities before addressing protection gaps.',
    alignsWithSolutions: ['Reduce Unsustainable Debt'],
  },
  {
    strategy: 'maintain_lifestyle_discipline',
    label: 'Pay Medical Bills Only',
    description: 'Cover immediate costs without changing protection planning.',
    alignsWithSolutions: [],
  },
  {
    strategy: 'increase_lifestyle',
    label: 'Defer Protection Planning',
    description: 'Postpone protection decisions and maintain current spending.',
    alignsWithSolutions: [],
  },
]

const OPTIONS_BY_SCENARIO: Record<ScenarioId, DecisionOption[]> = {
  promotion: PROMOTION_DECISION_OPTIONS,
  protection_stress: PROTECTION_STRESS_DECISION_OPTIONS,
}

export function getDecisionOptions(scenarioId: ScenarioId = 'promotion'): DecisionOption[] {
  return [...OPTIONS_BY_SCENARIO[scenarioId]]
}

export function isValidDecisionStrategy(
  value: string,
  scenarioId: ScenarioId = 'promotion',
): value is DecisionStrategy {
  return OPTIONS_BY_SCENARIO[scenarioId].some((o) => o.strategy === value)
}
