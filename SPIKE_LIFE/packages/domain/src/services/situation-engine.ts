import type { CurrencyConfig, EncounterRecord } from '@spike-life/content-core'
import type { FinancialProfile } from '../entities/financial-state.js'
import type { SituationKind } from '../types.js'
import { Money } from '../value-objects/money.js'

export const PROMOTION_EVENT_ID = 'C001_promotion'
export const PROTECTION_STRESS_EVENT_ID = 'H016_family_breadwinner_illness'

/** +15% income — Simulation Blueprint v2.1 C001 */
export const PROMOTION_INCOME_MULTIPLIER = 1.15

/** One-time medical cost applied when protection stress event occurs */
export const PROTECTION_STRESS_MEDICAL_COST = 45_000

/** Ongoing monthly care cost after the event */
export const PROTECTION_STRESS_MONTHLY_CARE_COST = 2_500

export interface SituationSnapshot {
  eventId: string
  situationKind: SituationKind
  title: string
  narrative: string
  learningObjective: string
  incomeMultiplier: number
  expenseMultiplier: number
  financialImpactSummary: string
  /** One-time cash impact (protection stress) */
  medicalCostImpact?: number
  /** Added to monthly expenses (protection stress) */
  monthlyCareCost?: number
}

export function createPromotionSituation(
  profileBefore: FinancialProfile,
  currency: CurrencyConfig,
): SituationSnapshot {
  const incomeBefore = profileBefore.monthlyIncome
  const incomeAfter = Math.round(incomeBefore * PROMOTION_INCOME_MULTIPLIER)
  const monthlyRaise = incomeAfter - incomeBefore

  return {
    eventId: PROMOTION_EVENT_ID,
    situationKind: 'income_opportunity',
    title: 'Promotion',
    narrative:
      'Congratulations — you received a promotion. Your income has increased, '
      + 'and new financial choices are now available.',
    learningObjective:
      'Higher income creates opportunity — and the risk of lifestyle inflation. '
      + 'Use Financial Needs Analysis before deciding how to allocate the raise.',
    incomeMultiplier: PROMOTION_INCOME_MULTIPLIER,
    expenseMultiplier: 1,
    financialImpactSummary:
      `Monthly income increases from ${Money.of(incomeBefore, currency.code).format(currency)} `
      + `to ${Money.of(incomeAfter, currency.code).format(currency)} (+${Money.of(monthlyRaise, currency.code).format(currency)}/month).`,
  }
}

export function applySituationToIncome(
  profile: FinancialProfile,
  situation: SituationSnapshot,
): FinancialProfile {
  return {
    ...profile,
    monthlyIncome: Math.round(profile.monthlyIncome * situation.incomeMultiplier),
    monthlyExpenses: Math.round(profile.monthlyExpenses * situation.expenseMultiplier),
  }
}

export function monthlyRaiseFromSituation(
  profileBefore: FinancialProfile,
  situation: SituationSnapshot,
): number {
  const after = Math.round(profileBefore.monthlyIncome * situation.incomeMultiplier)
  return after - profileBefore.monthlyIncome
}

export function createProtectionStressSituation(
  profile: FinancialProfile,
  currency: CurrencyConfig,
): SituationSnapshot {
  const medicalCost = PROTECTION_STRESS_MEDICAL_COST
  const careCost = PROTECTION_STRESS_MONTHLY_CARE_COST
  const cashAfter = Math.max(0, profile.cash - medicalCost)

  return {
    eventId: PROTECTION_STRESS_EVENT_ID,
    situationKind: 'protection_stress',
    title: 'Family Health Concern',
    narrative:
      'A close family member faces a serious health concern. Medical costs are mounting, '
      + 'and your family\'s financial vulnerability is now visible.',
    learningObjective:
      'Health events expose protection gaps. Financial Needs Analysis should guide '
      + 'protection planning — not panic spending or avoidance.',
    incomeMultiplier: 1,
    expenseMultiplier: 1,
    medicalCostImpact: medicalCost,
    monthlyCareCost: careCost,
    financialImpactSummary:
      `${Money.of(medicalCost, currency.code).format(currency)} in immediate medical costs. `
      + `Cash drops to ${Money.of(cashAfter, currency.code).format(currency)}. `
      + `Ongoing care adds ${Money.of(careCost, currency.code).format(currency)}/month.`,
  }
}

export function applyProtectionStressToProfile(
  profile: FinancialProfile,
  situation: SituationSnapshot,
): FinancialProfile {
  const medicalCost = situation.medicalCostImpact ?? 0
  const careCost = situation.monthlyCareCost ?? 0

  return {
    ...profile,
    cash: Math.max(0, profile.cash - medicalCost),
    monthlyExpenses: profile.monthlyExpenses + careCost,
  }
}

/** Monthly headroom for non-promotion encounters (no raise applied). */
export function planningDecisionCapacity(profile: FinancialProfile): number {
  const surplus = profile.monthlyIncome
    - profile.monthlyExpenses
    - profile.monthlyDebtPayments
    - profile.monthlyProtectionCost
  return Math.max(0, Math.round(Math.max(surplus, profile.monthlyIncome * 0.08)))
}

/** Monthly capacity the player can direct toward protection planning responses. */
export function protectionDecisionCapacity(profile: FinancialProfile): number {
  const surplus = profile.monthlyIncome
    - profile.monthlyExpenses
    - profile.monthlyDebtPayments
    - profile.monthlyProtectionCost
  return Math.max(0, Math.round(surplus * 0.6))
}

/** Build a situation snapshot from a content-pack encounter (board-selected). */
export function createSituationFromEncounter(
  enc: EncounterRecord,
  profile: FinancialProfile,
  currency: CurrencyConfig,
): SituationSnapshot {
  const isProtection = enc.scenarioTemplate === 'protection_stress'
    || enc.situationKind === 'protection_stress'

  if (isProtection) {
    const base = createProtectionStressSituation(profile, currency)
    return {
      ...base,
      eventId: enc.id,
      title: enc.title,
      narrative: enc.narrative || enc.teaser,
      learningObjective: enc.learningObjective,
    }
  }

  const incomeMultiplier = enc.situationKind === 'income_opportunity' ? 1.05 : 1
  const incomeAfter = Math.round(profile.monthlyIncome * incomeMultiplier)
  const monthlyRaise = incomeAfter - profile.monthlyIncome

  return {
    eventId: enc.id,
    situationKind: enc.situationKind ?? 'life_event',
    title: enc.title,
    narrative: enc.narrative || enc.teaser,
    learningObjective: enc.learningObjective,
    incomeMultiplier,
    expenseMultiplier: 1,
    financialImpactSummary: enc.teaser
      ?? (monthlyRaise > 0
        ? `Income may rise by ${Money.of(monthlyRaise, currency.code).format(currency)}/month if you act.`
        : 'Your choice will shape cash flow, goals, and protection this cycle.'),
  }
}
