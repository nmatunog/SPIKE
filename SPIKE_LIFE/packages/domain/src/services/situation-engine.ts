import type { FinancialProfile } from '../entities/financial-state.js'

export const PROMOTION_EVENT_ID = 'C001_promotion'

/** +15% income — Simulation Blueprint v2.1 C001 */
export const PROMOTION_INCOME_MULTIPLIER = 1.15

export interface SituationSnapshot {
  eventId: string
  title: string
  narrative: string
  learningObjective: string
  incomeMultiplier: number
  expenseMultiplier: number
  financialImpactSummary: string
}

export function createPromotionSituation(
  profileBefore: FinancialProfile,
): SituationSnapshot {
  const incomeBefore = profileBefore.monthlyIncome
  const incomeAfter = Math.round(incomeBefore * PROMOTION_INCOME_MULTIPLIER)
  const monthlyRaise = incomeAfter - incomeBefore

  return {
    eventId: PROMOTION_EVENT_ID,
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
      `Monthly income increases from ₱${incomeBefore.toLocaleString('en-PH')} `
      + `to ₱${incomeAfter.toLocaleString('en-PH')} (+₱${monthlyRaise.toLocaleString('en-PH')}/month).`,
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
