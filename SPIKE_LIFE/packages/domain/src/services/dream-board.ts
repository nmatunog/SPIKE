import type { DreamBoardDefaults, DreamBoardGoalDefault } from '@spike-life/content-core'
import type { FinancialGoal } from '../entities/financial-state.js'
import { getCampaignConfig, getInflationRate } from './campaign-context.js'

export interface DreamBoardGoalChoice {
  goalId: string
  goalName: string
  enabled: boolean
  presentValue: number
  targetAge: number
  futureValue: number
  icon?: string
}

export interface DreamBoardState {
  completedAt: string | null
  goals: DreamBoardGoalChoice[]
  emergencyFundTarget: number
}

export function futureValue(
  presentValue: number,
  yearsAhead: number,
  inflationRate = getInflationRate(),
): number {
  if (yearsAhead <= 0) return presentValue
  return Math.round(presentValue * (1 + inflationRate) ** yearsAhead)
}

export function buildDefaultDreamBoard(
  startingAge: number,
  monthlyIncome: number,
  defaults?: DreamBoardDefaults,
): DreamBoardState {
  const config = defaults ?? getCampaignConfig().dreamBoard
  const inflation = config.inflationRateAnnual ?? getInflationRate()

  const goals: DreamBoardGoalChoice[] = config.goals.map((goal: DreamBoardGoalDefault) => {
    const yearsAhead = Math.max(0, goal.defaultTargetAge - startingAge)
    return {
      goalId: goal.goalId,
      goalName: goal.goalName,
      enabled: !goal.optional,
      presentValue: goal.presentValue,
      targetAge: goal.defaultTargetAge,
      futureValue: futureValue(goal.presentValue, yearsAhead, inflation),
      icon: goal.icon,
    }
  })

  return {
    completedAt: null,
    goals,
    emergencyFundTarget: monthlyIncome * config.emergencyFundMonths,
  }
}

export function dreamBoardToFinancialGoals(
  board: DreamBoardState,
  currentFundingByGoal: Record<string, number> = {},
): FinancialGoal[] {
  const goals: FinancialGoal[] = board.goals
    .filter((g) => g.enabled)
    .map((g) => ({
      goalId: g.goalId,
      goalName: g.goalName,
      targetAmount: g.futureValue,
      targetAge: g.targetAge,
      currentFunding: currentFundingByGoal[g.goalId] ?? 0,
      status: 'active' as const,
    }))

  goals.unshift({
    goalId: 'emergency_fund',
    goalName: 'Emergency Fund',
    targetAmount: board.emergencyFundTarget,
    targetAge: 0,
    currentFunding: currentFundingByGoal.emergency_fund ?? 0,
    status: 'active',
  })

  return goals
}

export function completeDreamBoard(board: DreamBoardState): DreamBoardState {
  return {
    ...board,
    completedAt: new Date().toISOString(),
  }
}
