import type { CurrencyConfig } from '@spike-life/content-core'
import {
  annualIncome,
  monthlySurplus,
  type Character,
  type FinancialProfile,
  type GoalPortfolio,
  type ProtectionPortfolio,
} from '../entities/financial-state.js'
import { formatAmount } from '../value-objects/money.js'
import type { SituationSnapshot } from './situation-engine.js'

export interface DiscoveryObservation {
  question: string
  answer: string
}

export interface DiscoverySnapshot {
  situationEventId: string
  observations: DiscoveryObservation[]
  whatChanged: string[]
  risks: string[]
  opportunities: string[]
  generatedAt: string
}

export function runDiscovery(
  character: Character,
  profile: FinancialProfile,
  _protection: ProtectionPortfolio,
  goals: GoalPortfolio,
  situation: SituationSnapshot,
  currency: CurrencyConfig,
): DiscoverySnapshot {
  if (situation.situationKind === 'protection_stress') {
    return runProtectionStressDiscovery(character, profile, situation, currency)
  }

  return runPromotionDiscovery(character, profile, goals, situation, currency)
}

function runPromotionDiscovery(
  character: Character,
  profile: FinancialProfile,
  goals: GoalPortfolio,
  situation: SituationSnapshot,
  currency: CurrencyConfig,
): DiscoverySnapshot {
  const surplus = monthlySurplus(profile)
  const annual = annualIncome(profile)

  const whatChanged = [
    situation.financialImpactSummary,
    'Discretionary capacity may increase if expenses stay disciplined.',
  ]

  const risks = [
    'Lifestyle inflation can absorb the entire raise without improving financial security.',
    'Protection and goal gaps may remain unaddressed without intentional allocation.',
  ]

  if (character.dependents > 0) {
    risks.push('Dependents increase the cost of under-protection.')
  }

  const opportunities = [
    'Accelerate emergency fund funding toward six months of expenses.',
    'Improve protection readiness while income is higher.',
    'Allocate toward retirement and long-term goals earlier in your career.',
  ]

  if (goals.goals.some((g) => g.goalId === 'emergency_fund' && g.currentFunding < g.targetAmount)) {
    opportunities.unshift('Close the emergency fund gap while cash flow is stronger.')
  }

  const observations: DiscoveryObservation[] = [
    {
      question: 'What changed?',
      answer: `Income increased following "${situation.title}". Monthly surplus is now approximately ${formatAmount(surplus, currency)}.`,
    },
    {
      question: 'What financial risks now exist?',
      answer: risks.join(' '),
    },
    {
      question: 'What financial opportunities now exist?',
      answer: opportunities.join(' '),
    },
    {
      question: 'What should I prioritize?',
      answer: 'Complete Financial Needs Analysis to rank gaps before acting on the raise.',
    },
    {
      question: 'What should I recommend?',
      answer: `With annual income of ${formatAmount(annual, currency)}, prioritize sustainability (cash flow), then protection, then goals.`,
    },
    {
      question: 'Why?',
      answer: situation.learningObjective,
    },
  ]

  return {
    situationEventId: situation.eventId,
    observations,
    whatChanged,
    risks,
    opportunities,
    generatedAt: new Date().toISOString(),
  }
}

function runProtectionStressDiscovery(
  character: Character,
  profile: FinancialProfile,
  situation: SituationSnapshot,
  currency: CurrencyConfig,
): DiscoverySnapshot {
  const surplus = monthlySurplus(profile)
  const annual = annualIncome(profile)

  const whatChanged = [
    situation.financialImpactSummary,
    'Family health events increase both immediate costs and long-term protection needs.',
  ]

  const risks = [
    'Without adequate protection plans, future medical costs could deplete savings and derail goals.',
    'Delaying protection planning leaves the family exposed to income interruption.',
    'Paying medical bills from cash alone does not close the protection gap.',
  ]

  if (character.dependents > 0) {
    risks.push('Dependents rely on your income — income protection readiness is critical.')
  }

  const opportunities = [
    'Strengthen Family Protection Plan and Health Protection Plan while gaps are visible.',
    'Review Income Protection Plan readiness against two years of income.',
    'Balance emergency fund preservation with protection planning priorities.',
  ]

  const observations: DiscoveryObservation[] = [
    {
      question: 'What changed?',
      answer: `A family health concern created ${situation.financialImpactSummary} Monthly surplus is now approximately ${formatAmount(surplus, currency)}.`,
    },
    {
      question: 'What financial risks now exist?',
      answer: risks.join(' '),
    },
    {
      question: 'What financial opportunities now exist?',
      answer: opportunities.join(' '),
    },
    {
      question: 'What should I prioritize?',
      answer: 'Run Financial Needs Analysis — protection gaps are likely the top priority.',
    },
    {
      question: 'What should I recommend?',
      answer: `With annual income of ${formatAmount(annual, currency)} and ${character.dependents} dependent(s), prioritize protection planning before discretionary spending.`,
    },
    {
      question: 'Why?',
      answer: situation.learningObjective,
    },
  ]

  return {
    situationEventId: situation.eventId,
    observations,
    whatChanged,
    risks,
    opportunities,
    generatedAt: new Date().toISOString(),
  }
}
