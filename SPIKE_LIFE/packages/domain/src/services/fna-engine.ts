import {
  annualExpenses,
  annualIncome,
  goalFundingGap,
  monthlySurplus,
  retirementAssets,
  totalLiabilities,
  type Character,
  type FinancialProfile,
  type GoalPortfolio,
  type ProtectionPortfolio,
} from '../entities/financial-state.js'
import type { PriorityLevel } from '../types.js'

export interface DimensionGap {
  dimension: 'cashFlow' | 'protection' | 'debt' | 'goals' | 'retirement'
  score: number
  gapPercent: number
  priority: PriorityLevel
  summary: string
}

export interface FnaSnapshot {
  cashFlowScore: number
  protectionScore: number
  debtScore: number
  goalScore: number
  retirementScore: number
  overallScore: number
  rating: string
  topPriority: string
  gaps: DimensionGap[]
  emergencyFundTarget: number
  emergencyFundProgress: number
  familyProtectionNeed: number
  familyProtectionGap: number
  healthProtectionNeed: number
  retirementTarget: number
  computedAt: string
}

function scoreCashFlowSurplusRatio(ratio: number): number {
  if (ratio < 0) return 0
  if (ratio >= 0.2) return 100
  if (ratio >= 0.15) return 80
  if (ratio >= 0.1) return 60
  if (ratio >= 0.05) return 40
  return 20
}

function scoreProtectionAdequacy(adequacy: number): number {
  if (adequacy >= 1) return 100
  if (adequacy >= 0.75) return 80
  if (adequacy >= 0.5) return 60
  if (adequacy >= 0.25) return 40
  return 20
}

function scoreDebtRatio(ratio: number): number {
  if (ratio < 0.2) return 100
  if (ratio < 0.3) return 80
  if (ratio < 0.4) return 60
  if (ratio < 0.5) return 40
  return 20
}

function priorityFromGap(gapPercent: number): PriorityLevel {
  if (gapPercent >= 70) return 'critical'
  if (gapPercent >= 50) return 'high'
  if (gapPercent >= 30) return 'medium'
  return 'low'
}

function fnaRating(score: number): string {
  if (score >= 90) return 'Financially Secure'
  if (score >= 80) return 'Well Planned'
  if (score >= 70) return 'Progressing Well'
  if (score >= 60) return 'Needs Attention'
  if (score >= 50) return 'At Risk'
  return 'Critical Gaps'
}

function averageGoalProgress(portfolio: GoalPortfolio): number {
  if (portfolio.goals.length === 0) return 0
  const total = portfolio.goals.reduce((sum, goal) => {
    const progress = goal.targetAmount > 0
      ? Math.min(1, goal.currentFunding / goal.targetAmount)
      : 0
    return sum + progress
  }, 0)
  return total / portfolio.goals.length
}

export function runFnaAnalysis(
  character: Character,
  profile: FinancialProfile,
  protection: ProtectionPortfolio,
  goals: GoalPortfolio,
): FnaSnapshot {
  const income = profile.monthlyIncome
  const surplus = monthlySurplus(profile)
  const surplusRatio = income > 0 ? surplus / income : 0
  let cashFlowScore = scoreCashFlowSurplusRatio(surplusRatio)

  const emergencyFundTarget = profile.monthlyExpenses * 6
  const emergencyFundProgress = emergencyFundTarget > 0
    ? Math.min(1, profile.cash / emergencyFundTarget)
    : 0

  if (emergencyFundProgress < 0.5) {
    cashFlowScore = Math.min(cashFlowScore, emergencyFundProgress < 0.25 ? 40 : 60)
  }

  const annualInc = annualIncome(profile)
  const liabilities = totalLiabilities(profile)
  const fundingGap = goalFundingGap(goals)

  const familyProtectionNeed = annualInc * 10 + liabilities + fundingGap
  const familyProtectionCover = protection.lifeCover
  const familyAdequacy = familyProtectionNeed > 0
    ? familyProtectionCover / familyProtectionNeed
    : 1

  const healthProtectionNeed = 500_000 + character.dependents * 250_000
  const healthProtectionCover = protection.medicalCover + protection.criticalIllnessCover
  const healthAdequacy = healthProtectionNeed > 0
    ? healthProtectionCover / healthProtectionNeed
    : 1

  const incomeProtectionNeed = annualInc * 2
  const incomeAdequacy = incomeProtectionNeed > 0
    ? protection.incomeProtectionCover / incomeProtectionNeed
    : 1

  const protectionAdequacy = Math.min(familyAdequacy, healthAdequacy, incomeAdequacy)
  const protectionScore = scoreProtectionAdequacy(protectionAdequacy)

  const debtRatio = income > 0 ? profile.monthlyDebtPayments / income : 0
  const debtScore = scoreDebtRatio(debtRatio)

  const goalProgress = averageGoalProgress(goals)
  const goalScore = Math.round(goalProgress * 100)

  const retirementTarget = annualExpenses(profile) * 20
  const retirementReadiness = retirementTarget > 0
    ? retirementAssets(profile) / retirementTarget
    : 0
  const retirementScore = Math.round(Math.min(1, retirementReadiness) * 100)

  const overallScore = Math.round(
    cashFlowScore * 0.2
    + protectionScore * 0.3
    + debtScore * 0.15
    + goalScore * 0.2
    + retirementScore * 0.15,
  )

  const gaps = ([
    {
      dimension: 'cashFlow' as const,
      score: cashFlowScore,
      gapPercent: 100 - cashFlowScore,
      priority: priorityFromGap(100 - cashFlowScore),
      summary: emergencyFundProgress < 1
        ? `Emergency fund is ${Math.round(emergencyFundProgress * 100)}% of six-month target.`
        : 'Cash flow surplus is sustainable.',
    },
    {
      dimension: 'protection' as const,
      score: protectionScore,
      gapPercent: 100 - protectionScore,
      priority: priorityFromGap(100 - protectionScore),
      summary: `Protection readiness is ${Math.round(protectionAdequacy * 100)}% of combined needs.`,
    },
    {
      dimension: 'debt' as const,
      score: debtScore,
      gapPercent: 100 - debtScore,
      priority: priorityFromGap(100 - debtScore),
      summary: debtRatio > 0.3
        ? `Debt payments consume ${Math.round(debtRatio * 100)}% of income.`
        : 'Debt levels are manageable.',
    },
    {
      dimension: 'goals' as const,
      score: goalScore,
      gapPercent: 100 - goalScore,
      priority: priorityFromGap(100 - goalScore),
      summary: `Average goal funding progress is ${goalScore}%.`,
    },
    {
      dimension: 'retirement' as const,
      score: retirementScore,
      gapPercent: 100 - retirementScore,
      priority: priorityFromGap(100 - retirementScore),
      summary: `Retirement funding is ${retirementScore}% of long-term target.`,
    },
  ] satisfies DimensionGap[]).sort((a, b) => b.gapPercent - a.gapPercent)

  const topGap = gaps[0]
  const topPriorityLabels: Record<DimensionGap['dimension'], string> = {
    cashFlow: 'Cash Flow & Emergency Fund',
    protection: 'Protection Planning',
    debt: 'Debt Management',
    goals: 'Goal Funding',
    retirement: 'Retirement Readiness',
  }

  return {
    cashFlowScore,
    protectionScore,
    debtScore,
    goalScore,
    retirementScore,
    overallScore,
    rating: fnaRating(overallScore),
    topPriority: topGap ? topPriorityLabels[topGap.dimension] : 'Financial Planning',
    gaps,
    emergencyFundTarget,
    emergencyFundProgress,
    familyProtectionNeed,
    familyProtectionGap: Math.max(0, familyProtectionNeed - familyProtectionCover),
    healthProtectionNeed,
    retirementTarget,
    computedAt: new Date().toISOString(),
  }
}
