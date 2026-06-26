import type { Character, FinancialProfile, GoalPortfolio, ProtectionPortfolio } from '../entities/financial-state.js'

/** Young family archetype — protection gap stress test (Blueprint H016). */
export const PROTECTION_STRESS_CHARACTER: Character = {
  id: 'char-young-family',
  name: 'Jordan',
  age: 30,
  careerType: 'employee',
  lifeStage: 'build',
  maritalStatus: 'married',
  dependents: 1,
  archetypeId: 'young_family',
}

export const PROTECTION_STRESS_FINANCIAL_PROFILE: FinancialProfile = {
  cash: 75_000,
  investments: 20_000,
  propertyValue: 0,
  businessValue: 0,
  creditCardDebt: 15_000,
  personalLoan: 0,
  housingLoan: 0,
  businessLoan: 0,
  monthlyIncome: 45_000,
  monthlyExpenses: 28_000,
  monthlyDebtPayments: 2_000,
  monthlyProtectionCost: 0,
}

export const PROTECTION_STRESS_PROTECTION: ProtectionPortfolio = {
  lifeCover: 0,
  criticalIllnessCover: 0,
  medicalCover: 0,
  accidentCover: 0,
  incomeProtectionCover: 0,
}

export const PROTECTION_STRESS_GOALS: GoalPortfolio = {
  goals: [
    {
      goalId: 'emergency_fund',
      goalName: 'Emergency Fund',
      targetAmount: 180_000,
      targetAge: 32,
      currentFunding: 75_000,
      status: 'active',
    },
    {
      goalId: 'child_education',
      goalName: 'Child Education Fund',
      targetAmount: 1_500_000,
      targetAge: 45,
      currentFunding: 20_000,
      status: 'active',
    },
  ],
}

export interface ProtectionStressBundle {
  character: Character
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
}

export function createProtectionStressBundle(): ProtectionStressBundle {
  return {
    character: { ...PROTECTION_STRESS_CHARACTER },
    financialProfile: { ...PROTECTION_STRESS_FINANCIAL_PROFILE },
    protectionPortfolio: { ...PROTECTION_STRESS_PROTECTION },
    goalPortfolio: {
      goals: PROTECTION_STRESS_GOALS.goals.map((g) => ({ ...g })),
    },
  }
}
