import type { FnaSnapshot } from './fna-engine.js'

export type FinancialHealthBand =
  | 'excellent'
  | 'good'
  | 'stable'
  | 'vulnerable'
  | 'critical'

export interface FinancialHealthView {
  band: FinancialHealthBand
  label: string
  score: number
}

const BAND_LABELS: Record<FinancialHealthBand, string> = {
  excellent: 'Excellent',
  good: 'Good',
  stable: 'Stable',
  vulnerable: 'Vulnerable',
  critical: 'Critical',
}

export function financialHealthBandFromScore(score: number): FinancialHealthBand {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 55) return 'stable'
  if (score >= 40) return 'vulnerable'
  return 'critical'
}

/** Summarizes cash flow, protection, debt, goals, and stability into a 5-level band. */
export function computeFinancialHealth(
  fna: Pick<
    FnaSnapshot,
    'cashFlowScore' | 'protectionScore' | 'debtScore' | 'goalScore' | 'retirementScore'
  > | null,
): FinancialHealthView {
  if (!fna) {
    return { band: 'stable', label: BAND_LABELS.stable, score: 55 }
  }

  const score = Math.round(
    fna.cashFlowScore * 0.25
    + fna.protectionScore * 0.25
    + fna.debtScore * 0.15
    + fna.goalScore * 0.15
    + fna.retirementScore * 0.2,
  )
  const band = financialHealthBandFromScore(score)
  return { band, label: BAND_LABELS[band], score }
}
