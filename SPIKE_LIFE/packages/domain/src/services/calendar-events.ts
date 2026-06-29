import type { DecisionStrategy } from '../types.js'
import type { FinancialProfile } from '../entities/financial-state.js'
import type { ThirteenthMonthAllocation } from '@spike-life/content-core'

export interface AnnualCheckpointSnapshot {
  simulationYear: number
  netWorth: number
  monthlySurplus: number
  emergencyFundProgress: number
  protectionScore: number
  goalProgress: number
  lifeScoreOverall: number
  advisorInsight: string
}

export type PendingCalendarEvent =
  | 'thirteenth_month'
  | 'annual_checkpoint'
  | null

const CHECKPOINT_INSIGHTS = [
  'Small consistent moves beat heroic one-time efforts.',
  'Your emergency fund is your first line of defense.',
  'Protection gaps are cheapest to close before a crisis.',
]

export function thirteenthMonthBonus(profile: FinancialProfile): number {
  return profile.monthlyIncome
}

export function allocationToStrategy(
  allocation: ThirteenthMonthAllocation,
): DecisionStrategy {
  const strategy = allocation.strategy
  const allowed: DecisionStrategy[] = [
    'increase_lifestyle',
    'increase_savings',
    'reduce_debt',
    'improve_protection',
    'fund_goals',
    'split_allocation',
    'maintain_lifestyle_discipline',
  ]
  return allowed.includes(strategy as DecisionStrategy)
    ? (strategy as DecisionStrategy)
    : 'increase_savings'
}

export function buildAnnualCheckpoint(
  simulationYear: number,
  netWorth: number,
  monthlySurplus: number,
  emergencyFundProgress: number,
  protectionScore: number,
  goalProgress: number,
  lifeScoreOverall: number,
): AnnualCheckpointSnapshot {
  return {
    simulationYear,
    netWorth,
    monthlySurplus,
    emergencyFundProgress,
    protectionScore,
    goalProgress,
    lifeScoreOverall,
    advisorInsight: CHECKPOINT_INSIGHTS[simulationYear % CHECKPOINT_INSIGHTS.length]!,
  }
}

export function shouldTriggerThirteenthMonth(
  simulationYear: number,
  isYearEnd: boolean,
): boolean {
  return isYearEnd && simulationYear > 0
}
