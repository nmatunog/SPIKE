import {
  netWorth,
  type FinancialProfile,
} from '../entities/financial-state.js'
import type { FnaSnapshot } from './fna-engine.js'
import type { DecisionQuality } from './consequence-engine.js'

export interface LifeScoreSnapshot {
  cashFlow: number
  protection: number
  goals: number
  wealth: number
  retirement: number
  impact: number
  overall: number
  rating: string
}

function wealthScore(profile: FinancialProfile): number {
  const nw = netWorth(profile)
  const annualIncome = profile.monthlyIncome * 12
  if (annualIncome <= 0) return nw > 0 ? 50 : 0
  const ratio = nw / annualIncome
  if (ratio >= 3) return 100
  if (ratio >= 2) return 85
  if (ratio >= 1) return 70
  if (ratio >= 0.5) return 55
  if (ratio >= 0) return 40
  return 20
}

function impactScore(quality: DecisionQuality | null): number {
  if (!quality) return 70
  const map: Record<DecisionQuality, number> = {
    excellent: 100,
    good: 85,
    needs_attention: 55,
    high_risk: 25,
  }
  return map[quality]
}

function lifeScoreRating(overall: number): string {
  if (overall >= 90) return 'Exceptional Preparedness'
  if (overall >= 80) return 'Strong Foundation'
  if (overall >= 70) return 'Progressing Well'
  if (overall >= 60) return 'Needs Attention'
  if (overall >= 50) return 'At Risk'
  return 'Critical Gaps'
}

/** Derives Life Score™ from FNA dimensions, wealth position, and decision impact. */
export function calculateLifeScore(
  fna: FnaSnapshot,
  profile: FinancialProfile,
  decisionQuality: DecisionQuality | null = null,
): LifeScoreSnapshot {
  const wealth = wealthScore(profile)
  const impact = impactScore(decisionQuality)

  const overall = Math.round(
    fna.cashFlowScore * 0.2
    + fna.protectionScore * 0.25
    + fna.goalScore * 0.15
    + wealth * 0.15
    + fna.retirementScore * 0.1
    + impact * 0.15,
  )

  return {
    cashFlow: fna.cashFlowScore,
    protection: fna.protectionScore,
    goals: fna.goalScore,
    wealth,
    retirement: fna.retirementScore,
    impact,
    overall,
    rating: lifeScoreRating(overall),
  }
}
