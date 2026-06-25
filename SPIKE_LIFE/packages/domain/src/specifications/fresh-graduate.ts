import type { Character, FinancialProfile, GoalPortfolio, ProtectionPortfolio } from '../entities/financial-state.js'

/** Fresh Graduate archetype — Simulation Blueprint v2.4 */
export const FRESH_GRADUATE_CHARACTER: Character = {
  id: 'char-fresh-graduate',
  name: 'Alex',
  age: 22,
  careerType: 'employee',
  lifeStage: 'launch',
  maritalStatus: 'single',
  dependents: 0,
  archetypeId: 'fresh_graduate',
}

export const FRESH_GRADUATE_FINANCIAL_PROFILE: FinancialProfile = {
  cash: 10_000,
  investments: 0,
  propertyValue: 0,
  businessValue: 0,
  creditCardDebt: 0,
  personalLoan: 0,
  housingLoan: 0,
  businessLoan: 0,
  monthlyIncome: 25_000,
  monthlyExpenses: 15_000,
  monthlyDebtPayments: 0,
  monthlyProtectionCost: 0,
}

export const FRESH_GRADUATE_PROTECTION: ProtectionPortfolio = {
  lifeCover: 0,
  criticalIllnessCover: 0,
  medicalCover: 0,
  accidentCover: 0,
  incomeProtectionCover: 0,
}

export const FRESH_GRADUATE_GOALS: GoalPortfolio = {
  goals: [
    {
      goalId: 'emergency_fund',
      goalName: 'Emergency Fund',
      targetAmount: 90_000,
      targetAge: 24,
      currentFunding: 10_000,
      status: 'active',
    },
    {
      goalId: 'travel',
      goalName: 'Travel Goal',
      targetAmount: 50_000,
      targetAge: 25,
      currentFunding: 0,
      status: 'active',
    },
    {
      goalId: 'first_home',
      goalName: 'First Home',
      targetAmount: 3_000_000,
      targetAge: 35,
      currentFunding: 0,
      status: 'active',
    },
  ],
}

export interface FreshGraduateBundle {
  character: Character
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
}

export function createFreshGraduateBundle(): FreshGraduateBundle {
  return {
    character: { ...FRESH_GRADUATE_CHARACTER },
    financialProfile: { ...FRESH_GRADUATE_FINANCIAL_PROFILE },
    protectionPortfolio: { ...FRESH_GRADUATE_PROTECTION },
    goalPortfolio: {
      goals: FRESH_GRADUATE_GOALS.goals.map((g) => ({ ...g })),
    },
  }
}
