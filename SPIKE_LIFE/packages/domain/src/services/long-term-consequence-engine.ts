import type { DecisionStrategy } from '../types.js'
import type { DecisionQuality } from './consequence-engine.js'

export type LongTermSeverity = 'positive' | 'neutral' | 'negative'

export interface HiddenLongTermConsequence {
  id: string
  recordedAtYear: number
  revealsAtYear: number
  strategy: DecisionStrategy
  decisionQuality: DecisionQuality
  summary: string
  severity: LongTermSeverity
  revealed: boolean
  revealedAt?: string
}

interface HiddenTemplate {
  summary: string
  yearsUntilReveal: number
  severity: LongTermSeverity
}

const HIDDEN_BY_STRATEGY: Partial<Record<DecisionStrategy, HiddenTemplate>> = {
  increase_lifestyle: {
    summary: 'Lifestyle inflation compounds quietly — long-term goals lose momentum.',
    yearsUntilReveal: 2,
    severity: 'negative',
  },
  increase_savings: {
    summary: 'Consistent saving builds a cushion that pays off in later years.',
    yearsUntilReveal: 2,
    severity: 'positive',
  },
  reduce_debt: {
    summary: 'Lower debt service frees future income for protection and goals.',
    yearsUntilReveal: 2,
    severity: 'positive',
  },
  improve_protection: {
    summary: 'Protection planning reduces the shock of future health or income events.',
    yearsUntilReveal: 3,
    severity: 'positive',
  },
  fund_goals: {
    summary: 'Goal funding today reduces scramble pressure in milestone years.',
    yearsUntilReveal: 2,
    severity: 'positive',
  },
  split_allocation: {
    summary: 'Balanced allocation smooths outcomes across cash flow and protection.',
    yearsUntilReveal: 2,
    severity: 'neutral',
  },
  maintain_lifestyle_discipline: {
    summary: 'Discipline after income changes preserves optionality for decades.',
    yearsUntilReveal: 2,
    severity: 'positive',
  },
}

const QUALITY_ADJUSTMENT: Partial<Record<DecisionQuality, { extraYears: number; severityShift: LongTermSeverity | null }>> = {
  high_risk: { extraYears: 1, severityShift: 'negative' },
  excellent: { extraYears: 0, severityShift: 'positive' },
}

export function recordHiddenLongTermConsequence(
  strategy: DecisionStrategy,
  decisionQuality: DecisionQuality,
  simulationYear: number,
  existing: HiddenLongTermConsequence[] = [],
): HiddenLongTermConsequence[] {
  const template = HIDDEN_BY_STRATEGY[strategy] ?? {
    summary: 'Every choice echoes — advisors track long-term effects clients do not see immediately.',
    yearsUntilReveal: 2,
    severity: 'neutral' as LongTermSeverity,
  }

  const adjustment = QUALITY_ADJUSTMENT[decisionQuality]
  let severity = adjustment?.severityShift ?? template.severity
  if (decisionQuality === 'high_risk' && severity === 'positive') severity = 'negative'

  const revealsAtYear = simulationYear + template.yearsUntilReveal + (adjustment?.extraYears ?? 0)

  const record: HiddenLongTermConsequence = {
    id: `ltc-${simulationYear}-${existing.length + 1}`,
    recordedAtYear: simulationYear,
    revealsAtYear,
    strategy,
    decisionQuality,
    summary: template.summary,
    severity,
    revealed: false,
  }

  return [...existing, record]
}

export function revealDueHiddenConsequences(
  consequences: HiddenLongTermConsequence[],
  currentYear: number,
): { updated: HiddenLongTermConsequence[]; newlyRevealed: HiddenLongTermConsequence[] } {
  const now = new Date().toISOString()
  const newlyRevealed: HiddenLongTermConsequence[] = []

  const updated = consequences.map((record) => {
    if (record.revealed || record.revealsAtYear > currentYear) return record
    const revealed = { ...record, revealed: true, revealedAt: now }
    newlyRevealed.push(revealed)
    return revealed
  })

  return { updated, newlyRevealed }
}

export function countPendingHidden(consequences: HiddenLongTermConsequence[]): number {
  return consequences.filter((c) => !c.revealed).length
}
