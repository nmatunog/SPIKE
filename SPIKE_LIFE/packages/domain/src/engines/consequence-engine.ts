import type { DecisionStrategy } from '../types.js'
import type {
  FinancialProfile,
  GoalPortfolio,
  ProtectionPortfolio,
} from '../entities/financial-state.js'
import type { FnaSnapshot } from './fna-engine.js'
import type { Recommendation } from './recommendation-engine.js'

export type DecisionQuality = 'excellent' | 'good' | 'needs_attention' | 'high_risk'

export interface ConsequenceOutcome {
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
  narrative: string
  decisionQuality: DecisionQuality
  qualityExplanation: string
  fnaScoreDelta: number
  cashDelta: number
  expensesDelta: number
  protectionCoverDelta: number
  appliedAt: string
}

const ANNUAL_ALLOCATION_FACTOR = 12

function allocateRaise(
  monthlyRaise: number,
  strategy: DecisionStrategy,
): {
  profile: Partial<FinancialProfile>
  protection: Partial<ProtectionPortfolio>
  goalFunding: number
  emergencyGoalId: string
} {
  const annualRaise = monthlyRaise * ANNUAL_ALLOCATION_FACTOR

  switch (strategy) {
    case 'increase_lifestyle':
      return {
        profile: { monthlyExpenses: monthlyRaise * 0.85 },
        protection: {},
        goalFunding: 0,
        emergencyGoalId: 'emergency_fund',
      }
    case 'increase_savings':
      return {
        profile: { cash: annualRaise * 0.9 },
        protection: {},
        goalFunding: 0,
        emergencyGoalId: 'emergency_fund',
      }
    case 'reduce_debt':
      return {
        profile: {
          creditCardDebt: -annualRaise * 0.8,
          monthlyDebtPayments: -monthlyRaise * 0.1,
        },
        protection: {},
        goalFunding: 0,
        emergencyGoalId: 'emergency_fund',
      }
    case 'improve_protection':
      return {
        profile: {
          monthlyProtectionCost: monthlyRaise * 0.15,
          cash: -annualRaise * 0.15,
        },
        protection: {
          medicalCover: annualRaise * 0.4,
          incomeProtectionCover: annualRaise * 0.35,
          lifeCover: annualRaise * 0.25,
        },
        goalFunding: 0,
        emergencyGoalId: 'emergency_fund',
      }
    case 'fund_goals':
      return {
        profile: { cash: -annualRaise * 0.1 },
        protection: {},
        goalFunding: annualRaise * 0.85,
        emergencyGoalId: 'emergency_fund',
      }
    case 'split_allocation':
      return {
        profile: {
          cash: annualRaise * 0.35,
          monthlyProtectionCost: monthlyRaise * 0.08,
        },
        protection: {
          medicalCover: annualRaise * 0.15,
          incomeProtectionCover: annualRaise * 0.1,
        },
        goalFunding: annualRaise * 0.3,
        emergencyGoalId: 'emergency_fund',
      }
    case 'maintain_lifestyle_discipline':
      return {
        profile: { cash: annualRaise * 0.7 },
        protection: {
          medicalCover: annualRaise * 0.1,
          incomeProtectionCover: annualRaise * 0.1,
        },
        goalFunding: annualRaise * 0.1,
        emergencyGoalId: 'emergency_fund',
      }
    default:
      return {
        profile: {},
        protection: {},
        goalFunding: 0,
        emergencyGoalId: 'emergency_fund',
      }
  }
}

function evaluateDecisionQuality(
  strategy: DecisionStrategy,
  fnaBefore: FnaSnapshot,
  recommendations: Recommendation[],
): { quality: DecisionQuality; explanation: string } {
  const topSolution = recommendations[0]?.solution

  const aligned =
    (strategy === 'increase_savings' && topSolution === 'BUILD_EMERGENCY_FUND')
    || (strategy === 'improve_protection' && fnaBefore.protectionScore < 60)
    || (strategy === 'maintain_lifestyle_discipline')
    || (strategy === 'split_allocation')

  if (strategy === 'increase_lifestyle' && fnaBefore.emergencyFundProgress < 0.75) {
    return {
      quality: 'high_risk',
      explanation:
        'Increasing lifestyle before closing the emergency fund gap amplifies vulnerability.',
    }
  }

  if (aligned && fnaBefore.overallScore < 70) {
    return {
      quality: 'excellent',
      explanation: 'Decision aligns with top FNA priorities and strengthens financial resilience.',
    }
  }

  if (strategy === 'fund_goals' || strategy === 'reduce_debt') {
    return {
      quality: 'good',
      explanation: 'Decision supports planning objectives with acceptable tradeoffs.',
    }
  }

  if (strategy === 'increase_lifestyle') {
    return {
      quality: 'needs_attention',
      explanation: 'Lifestyle upgrades without gap closure may delay financial security.',
    }
  }

  return {
    quality: 'good',
    explanation: 'Decision improves financial position relative to the prior state.',
  }
}

function applyGoalFunding(
  goals: GoalPortfolio,
  amount: number,
): GoalPortfolio {
  if (amount <= 0) return goals

  const updated = goals.goals.map((g) => ({ ...g }))
  const emergency = updated.find((g) => g.goalId === 'emergency_fund')
  const travel = updated.find((g) => g.goalId === 'travel')

  let remaining = amount
  if (emergency && emergency.currentFunding < emergency.targetAmount) {
    const add = Math.min(remaining, emergency.targetAmount - emergency.currentFunding)
    emergency.currentFunding += add
    remaining -= add
  }
  if (remaining > 0 && travel) {
    travel.currentFunding += Math.min(remaining, travel.targetAmount - travel.currentFunding)
  }

  return { goals: updated }
}

export function runConsequenceEngine(
  profile: FinancialProfile,
  protection: ProtectionPortfolio,
  goals: GoalPortfolio,
  strategy: DecisionStrategy,
  monthlyRaise: number,
  fnaBefore: FnaSnapshot,
  recommendations: Recommendation[],
): ConsequenceOutcome {
  const beforeCash = profile.cash
  const beforeExpenses = profile.monthlyExpenses
  const beforeProtection = protection.medicalCover + protection.incomeProtectionCover + protection.lifeCover

  const allocation = allocateRaise(monthlyRaise, strategy)

  const financialProfile: FinancialProfile = {
    ...profile,
    monthlyExpenses: profile.monthlyExpenses + (allocation.profile.monthlyExpenses ?? 0),
    monthlyDebtPayments: Math.max(
      0,
      profile.monthlyDebtPayments + (allocation.profile.monthlyDebtPayments ?? 0),
    ),
    monthlyProtectionCost: profile.monthlyProtectionCost + (allocation.profile.monthlyProtectionCost ?? 0),
    cash: Math.max(0, profile.cash + (allocation.profile.cash ?? 0)),
    creditCardDebt: Math.max(0, profile.creditCardDebt + (allocation.profile.creditCardDebt ?? 0)),
  }

  const protectionPortfolio: ProtectionPortfolio = {
    lifeCover: protection.lifeCover + (allocation.protection.lifeCover ?? 0),
    criticalIllnessCover: protection.criticalIllnessCover + (allocation.protection.criticalIllnessCover ?? 0),
    medicalCover: protection.medicalCover + (allocation.protection.medicalCover ?? 0),
    accidentCover: protection.accidentCover + (allocation.protection.accidentCover ?? 0),
    incomeProtectionCover: protection.incomeProtectionCover + (allocation.protection.incomeProtectionCover ?? 0),
  }

  let goalPortfolio = applyGoalFunding(goals, allocation.goalFunding)

  if (strategy === 'increase_savings' || strategy === 'maintain_lifestyle_discipline' || strategy === 'split_allocation') {
    const cashToEmergency = (allocation.profile.cash ?? 0) * (strategy === 'split_allocation' ? 0.5 : 1)
    goalPortfolio = applyGoalFunding(goalPortfolio, cashToEmergency)
    if (cashToEmergency > 0) {
      financialProfile.cash = Math.max(0, financialProfile.cash - cashToEmergency * 0.5)
    }
  }

  const { quality, explanation } = evaluateDecisionQuality(strategy, fnaBefore, recommendations)

  const afterProtection = protectionPortfolio.medicalCover
    + protectionPortfolio.incomeProtectionCover
    + protectionPortfolio.lifeCover

  const narratives: Record<DecisionStrategy, string> = {
    increase_lifestyle: 'Expenses rose with income. Cash flow improved less than the raise suggests.',
    increase_savings: 'Cash reserves grew. Emergency fund progress improved.',
    reduce_debt: 'Liabilities decreased, reducing future interest burden.',
    improve_protection: 'Protection readiness improved with new plan funding.',
    fund_goals: 'Goal funding advanced, especially toward near-term objectives.',
    split_allocation: 'The raise was distributed across savings, protection, and goals.',
    maintain_lifestyle_discipline: 'Expenses held steady while planning priorities absorbed the raise.',
  }

  return {
    financialProfile,
    protectionPortfolio,
    goalPortfolio,
    narrative: narratives[strategy],
    decisionQuality: quality,
    qualityExplanation: explanation,
    fnaScoreDelta: 0,
    cashDelta: financialProfile.cash - beforeCash,
    expensesDelta: financialProfile.monthlyExpenses - beforeExpenses,
    protectionCoverDelta: afterProtection - beforeProtection,
    appliedAt: new Date().toISOString(),
  }
}

export function attachFnaScoreDelta(
  outcome: ConsequenceOutcome,
  fnaBefore: FnaSnapshot,
  fnaAfter: FnaSnapshot,
): ConsequenceOutcome {
  return {
    ...outcome,
    fnaScoreDelta: fnaAfter.overallScore - fnaBefore.overallScore,
  }
}
