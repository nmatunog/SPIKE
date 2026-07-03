import type { DecisionStrategy, ScenarioId } from '../types.js'
import type {
  FinancialProfile,
  FinancialGoal,
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
  scenarioId: ScenarioId = 'promotion',
): { quality: DecisionQuality; explanation: string } {
  const topSolution = recommendations[0]?.solution

  if (scenarioId === 'protection_stress') {
    if (strategy === 'improve_protection' && fnaBefore.protectionScore < 70) {
      return {
        quality: 'excellent',
        explanation: 'Strengthening protection plans directly addresses the family\'s exposed vulnerability.',
      }
    }
    if (strategy === 'split_allocation' && fnaBefore.protectionScore < 70) {
      return {
        quality: 'good',
        explanation: 'Balancing protection and savings is reasonable when cash is strained.',
      }
    }
    if (strategy === 'increase_lifestyle') {
      return {
        quality: 'high_risk',
        explanation: 'Deferring protection planning after a health event leaves the family exposed.',
      }
    }
    if (strategy === 'increase_savings' && fnaBefore.topPriority.includes('Protection')) {
      return {
        quality: 'needs_attention',
        explanation: 'Cash reserves help, but protection gaps remain the primary FNA priority.',
      }
    }
    if (strategy === 'maintain_lifestyle_discipline') {
      return {
        quality: 'needs_attention',
        explanation: 'Paying bills without protection planning does not improve readiness.',
      }
    }
    return {
      quality: 'good',
      explanation: 'Decision partially addresses the situation with acceptable tradeoffs.',
    }
  }

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

function distributeToDreamGoals(
  goals: FinancialGoal[],
  amount: number,
): number {
  const dreamGoals = goals.filter(
    (g) => g.goalId !== 'emergency_fund' && g.status === 'active' && g.currentFunding < g.targetAmount,
  )
  if (dreamGoals.length === 0 || amount <= 0) return amount

  let remaining = amount
  const share = remaining / dreamGoals.length
  for (const goal of dreamGoals) {
    const gap = goal.targetAmount - goal.currentFunding
    const add = Math.min(remaining, share, gap)
    if (add > 0) {
      goal.currentFunding += add
      remaining -= add
    }
  }
  for (const goal of dreamGoals) {
    if (remaining <= 0) break
    const gap = goal.targetAmount - goal.currentFunding
    const add = Math.min(remaining, gap)
    if (add > 0) {
      goal.currentFunding += add
      remaining -= add
    }
  }
  return remaining
}

function applyGoalFunding(
  goals: GoalPortfolio,
  amount: number,
  strategy: DecisionStrategy,
): GoalPortfolio {
  if (amount <= 0) return goals

  const updated = goals.goals.map((g) => ({ ...g }))
  const emergency = updated.find((g) => g.goalId === 'emergency_fund')

  const fundEmergency = (pool: number): number => {
    if (!emergency || pool <= 0) return 0
    const gap = emergency.targetAmount - emergency.currentFunding
    if (gap <= 0) return 0
    const add = Math.min(pool, gap)
    emergency.currentFunding += add
    return add
  }

  let remaining = amount

  switch (strategy) {
    case 'fund_goals':
      remaining = distributeToDreamGoals(updated, remaining)
      fundEmergency(remaining)
      break
    case 'split_allocation': {
      const toEmergency = fundEmergency(remaining * 0.35)
      distributeToDreamGoals(updated, remaining - toEmergency)
      break
    }
    case 'maintain_lifestyle_discipline': {
      const toEmergency = fundEmergency(remaining * 0.4)
      distributeToDreamGoals(updated, remaining - toEmergency)
      break
    }
    case 'increase_savings':
    case 'reduce_debt':
      fundEmergency(remaining)
      break
    case 'improve_protection':
      distributeToDreamGoals(updated, remaining * 0.25)
      break
    case 'increase_lifestyle':
      break
    default:
      fundEmergency(remaining)
  }

  return { goals: updated }
}

export function runConsequenceEngine(
  profile: FinancialProfile,
  protection: ProtectionPortfolio,
  goals: GoalPortfolio,
  strategy: DecisionStrategy,
  monthlyCapacity: number,
  fnaBefore: FnaSnapshot,
  recommendations: Recommendation[],
  scenarioId: ScenarioId = 'promotion',
): ConsequenceOutcome {
  const beforeCash = profile.cash
  const beforeExpenses = profile.monthlyExpenses
  const beforeProtection = protection.medicalCover + protection.incomeProtectionCover + protection.lifeCover

  let allocation = allocateRaise(monthlyCapacity, strategy)

  let financialProfile: FinancialProfile = {
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

  let protectionPortfolio: ProtectionPortfolio = {
    lifeCover: protection.lifeCover + (allocation.protection.lifeCover ?? 0),
    criticalIllnessCover: protection.criticalIllnessCover + (allocation.protection.criticalIllnessCover ?? 0),
    medicalCover: protection.medicalCover + (allocation.protection.medicalCover ?? 0),
    accidentCover: protection.accidentCover + (allocation.protection.accidentCover ?? 0),
    incomeProtectionCover: protection.incomeProtectionCover + (allocation.protection.incomeProtectionCover ?? 0),
  }

  if (scenarioId === 'protection_stress' && strategy === 'improve_protection') {
    const familyNeed = fnaBefore.familyProtectionNeed
    const healthNeed = fnaBefore.healthProtectionNeed
    const incomeNeed = profile.monthlyIncome * 12 * 2

    protectionPortfolio = {
      lifeCover: Math.round(familyNeed * 0.4),
      criticalIllnessCover: Math.round(healthNeed * 0.2),
      medicalCover: Math.round(healthNeed * 0.45),
      accidentCover: 50_000,
      incomeProtectionCover: Math.round(incomeNeed * 0.45),
    }
    financialProfile = {
      ...financialProfile,
      monthlyProtectionCost: profile.monthlyProtectionCost + Math.round(monthlyCapacity * 0.75),
      cash: Math.max(0, profile.cash - Math.round(monthlyCapacity * 6)),
    }
  }

  if (scenarioId === 'protection_stress' && strategy === 'split_allocation') {
    const familyNeed = fnaBefore.familyProtectionNeed
    const healthNeed = fnaBefore.healthProtectionNeed

    protectionPortfolio = {
      ...protectionPortfolio,
      lifeCover: Math.max(protectionPortfolio.lifeCover, Math.round(familyNeed * 0.2)),
      medicalCover: Math.max(protectionPortfolio.medicalCover, Math.round(healthNeed * 0.25)),
      incomeProtectionCover: Math.max(
        protectionPortfolio.incomeProtectionCover,
        Math.round(profile.monthlyIncome * 12 * 0.5),
      ),
    }
  }

  let goalPortfolio = goals

  const liquidCash = allocation.profile.cash ?? 0
  let poolForGoals = allocation.goalFunding
  if (strategy === 'increase_savings') {
    poolForGoals += liquidCash
  } else if (strategy === 'split_allocation') {
    poolForGoals += liquidCash * 0.45
  } else if (strategy === 'maintain_lifestyle_discipline') {
    poolForGoals += liquidCash * 0.35
  }

  if (poolForGoals > 0) {
    goalPortfolio = applyGoalFunding(goals, poolForGoals, strategy)
  }

  if (strategy === 'increase_savings' && liquidCash > 0) {
    financialProfile.cash = Math.max(0, financialProfile.cash - liquidCash * 0.35)
  }

  const { quality, explanation } = evaluateDecisionQuality(
    strategy,
    fnaBefore,
    recommendations,
    scenarioId,
  )

  const afterProtection = protectionPortfolio.medicalCover
    + protectionPortfolio.incomeProtectionCover
    + protectionPortfolio.lifeCover

  const promotionNarratives: Record<DecisionStrategy, string> = {
    increase_lifestyle: 'Expenses rose with income. Cash flow improved less than the raise suggests.',
    increase_savings: 'Cash reserves grew. Emergency fund progress improved.',
    reduce_debt: 'Liabilities decreased, reducing future interest burden.',
    improve_protection: 'Protection readiness improved with new plan funding.',
    fund_goals: 'Goal funding advanced, especially toward near-term objectives.',
    split_allocation: 'The raise was distributed across savings, protection, and goals.',
    maintain_lifestyle_discipline: 'Expenses held steady while planning priorities absorbed the raise.',
  }

  const protectionNarratives: Record<DecisionStrategy, string> = {
    increase_lifestyle: 'Protection planning was deferred. The family remains financially exposed.',
    increase_savings: 'Cash reserves were rebuilt, but protection readiness improved little.',
    reduce_debt: 'Debt decreased slightly. Protection gaps remain a priority.',
    improve_protection: 'Family, health, and income protection readiness improved significantly.',
    fund_goals: 'Education and emergency goals advanced; protection gaps may persist.',
    split_allocation: 'Protection and savings were both strengthened with balanced tradeoffs.',
    maintain_lifestyle_discipline: 'Immediate medical costs were covered without closing protection gaps.',
  }

  const narratives = scenarioId === 'protection_stress' ? protectionNarratives : promotionNarratives

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
