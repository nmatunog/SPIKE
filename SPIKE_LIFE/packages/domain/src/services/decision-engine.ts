import type { DecisionStrategy } from '../types.js'

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

export function getDecisionOptions(): DecisionOption[] {
  return [...PROMOTION_DECISION_OPTIONS]
}

export function isValidDecisionStrategy(value: string): value is DecisionStrategy {
  return PROMOTION_DECISION_OPTIONS.some((o) => o.strategy === value)
}
