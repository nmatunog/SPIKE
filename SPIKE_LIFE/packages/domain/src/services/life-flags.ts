import type { LifeFlagState, LifeFlagValue } from '@spike-life/content-core'
import type { SimulationState } from '../aggregates/simulation-session.js'
import type { LifeStage } from '../types.js'
import { monthlySurplus } from '../entities/financial-state.js'

const CAREER_LEVEL_RANK: Record<string, number> = {
  none: 0,
  graduate: 1,
  apprentice: 2,
  junior: 3,
  regular: 4,
  manager: 5,
  director: 6,
  executive: 7,
}

export function flagEquals(
  actual: LifeFlagValue | undefined,
  expected: LifeFlagValue,
): boolean {
  if (typeof expected === 'boolean') {
    return Boolean(actual) === expected
  }
  return actual === expected
}

export function meetsFlagRequirements(
  flags: LifeFlagState,
  required?: Partial<Record<string, LifeFlagValue>>,
): boolean {
  if (!required) return true
  for (const [key, expected] of Object.entries(required)) {
    if (expected === undefined) continue
    if (!flagEquals(flags[key], expected)) return false
  }
  return true
}

/** Merge persisted flags with values inferred from financial + character state. */
export function deriveLifeFlags(state: SimulationState): LifeFlagState {
  const persisted = state.lifeFlags ?? {}
  const profile = state.financialProfile
  const fna = state.fnaAfterDecision ?? state.fnaBeforeDecision
  const age = state.character.age
  const lifeStage = state.character.lifeStage

  const employedFromHistory = state.eventHistory?.some((e) =>
    ['career_first_job', 'career_probation'].includes(e.lifeEventId),
  ) ?? false
  const employed = persisted.employed !== undefined
    ? Boolean(persisted.employed)
    : employedFromHistory

  const educationFromHistory = state.eventHistory?.some(
    (e) => e.lifeEventId === 'career_graduation',
  ) ?? false
  const educationCompleted = persisted.educationCompleted !== undefined
    ? Boolean(persisted.educationCompleted)
    : educationFromHistory

  const inferred: LifeFlagState = {
    employed: Boolean(employed),
    student: persisted.student ?? (age <= 24 && !employed && !educationCompleted),
    educationCompleted: Boolean(educationCompleted),
    ownsHouse: persisted.ownsHouse
      ?? state.goalPortfolio.goals.some(
        (g) => g.goalId === 'home' && (g.currentFunding ?? 0) >= (g.targetAmount ?? 1) * 0.5,
      ),
    married: Boolean(persisted.married),
    partnered: Boolean(persisted.partnered ?? persisted.married),
    hasChildren: Boolean(persisted.hasChildren),
    businessOwner: Boolean(persisted.businessOwner),
    insured: persisted.insured
      ?? (fna ? fna.protectionScore >= 60 : profile.monthlyProtectionCost > 0),
    emergencyFundComplete: persisted.emergencyFundComplete
      ?? (fna ? fna.emergencyFundProgress >= 100 : false),
    retired: persisted.retired ?? (lifeStage === 'legacy' || age >= 60),
    careerLevel: persisted.careerLevel ?? (employed ? 'junior' : 'none'),
  }

  return { ...inferred, ...persisted }
}

export function applyLifeEventEffects(
  flags: LifeFlagState,
  effects?: { setFlags?: Partial<Record<string, LifeFlagValue>> },
): LifeFlagState {
  if (!effects?.setFlags) return flags
  const next = { ...flags }
  for (const [key, value] of Object.entries(effects.setFlags)) {
    if (value !== undefined) next[key] = value
  }
  return next
}

export function employmentCycleCount(history: SimulationState['eventHistory']): number {
  if (!history?.length) return 0
  const employedEvents = new Set([
    'career_first_job',
    'career_probation',
    'career_promotion',
    'career_executive',
  ])
  return history.filter((e) => employedEvents.has(e.lifeEventId)).length
}

export function meetsLifeStage(
  lifeStage: LifeStage,
  allowed?: LifeStage[],
): boolean {
  if (!allowed?.length) return true
  return allowed.includes(lifeStage)
}

export function careerLevelAtLeast(flags: LifeFlagState, minimum: string): boolean {
  const current = String(flags.careerLevel ?? 'none')
  return (CAREER_LEVEL_RANK[current] ?? 0) >= (CAREER_LEVEL_RANK[minimum] ?? 0)
}

export function cashSavingsAmount(state: SimulationState): number {
  return state.financialProfile.cash
}

export function lifeScoreOverall(state: SimulationState): number {
  const fna = state.fnaAfterDecision ?? state.fnaBeforeDecision
  if (!fna) return 0
  return fna.overallScore
}

export function stableIncome(state: SimulationState): boolean {
  const flags = deriveLifeFlags(state)
  return flags.employed === true
    && state.financialProfile.monthlyIncome > 0
    && monthlySurplus(state.financialProfile) >= 0
}

export function meetsNumericRequirements(
  state: SimulationState,
  flags: LifeFlagState,
  numeric?: import('@spike-life/content-core').LifeEventNumericRequirements,
): boolean {
  if (!numeric) return true
  const cash = cashSavingsAmount(state)
  if (numeric.cashSavings?.min != null && cash < numeric.cashSavings.min) return false
  if (numeric.cashSavings?.max != null && cash > numeric.cashSavings.max) return false

  const score = lifeScoreOverall(state)
  if (numeric.lifeScore?.min != null && score < numeric.lifeScore.min) return false
  if (numeric.lifeScore?.max != null && score > numeric.lifeScore.max) return false

  if (numeric.employmentCycles?.min != null) {
    const tenure = employmentCycleCount(state.eventHistory)
    if (tenure < numeric.employmentCycles.min) return false
  }

  if (numeric.employmentCycles?.min != null && flags.employed !== true) {
    return false
  }

  return true
}
