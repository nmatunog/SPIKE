import type { CareerType, LifeStage } from '../types.js'

export interface Character {
  id: string
  name: string
  age: number
  careerType: CareerType
  lifeStage: LifeStage
  maritalStatus: 'single' | 'married'
  dependents: number
  archetypeId: string
}

export interface FinancialProfile {
  cash: number
  investments: number
  propertyValue: number
  businessValue: number
  creditCardDebt: number
  personalLoan: number
  housingLoan: number
  businessLoan: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyDebtPayments: number
  monthlyProtectionCost: number
}

export interface ProtectionPortfolio {
  lifeCover: number
  criticalIllnessCover: number
  medicalCover: number
  accidentCover: number
  incomeProtectionCover: number
}

export interface FinancialGoal {
  goalId: string
  goalName: string
  targetAmount: number
  targetAge: number
  currentFunding: number
  status: 'active' | 'completed'
}

export interface GoalPortfolio {
  goals: FinancialGoal[]
}

export function totalAssets(profile: FinancialProfile): number {
  return (
    profile.cash
    + profile.investments
    + profile.propertyValue
    + profile.businessValue
  )
}

export function totalLiabilities(profile: FinancialProfile): number {
  return (
    profile.creditCardDebt
    + profile.personalLoan
    + profile.housingLoan
    + profile.businessLoan
  )
}

export function netWorth(profile: FinancialProfile): number {
  return totalAssets(profile) - totalLiabilities(profile)
}

export function annualIncome(profile: FinancialProfile): number {
  return profile.monthlyIncome * 12
}

export function annualExpenses(profile: FinancialProfile): number {
  return profile.monthlyExpenses * 12
}

export function monthlySurplus(profile: FinancialProfile): number {
  return (
    profile.monthlyIncome
    - profile.monthlyExpenses
    - profile.monthlyDebtPayments
    - profile.monthlyProtectionCost
  )
}

export function goalFundingGap(portfolio: GoalPortfolio): number {
  return portfolio.goals.reduce((sum, goal) => {
    if (goal.status === 'completed') return sum
    return sum + Math.max(0, goal.targetAmount - goal.currentFunding)
  }, 0)
}

export function retirementAssets(profile: FinancialProfile): number {
  return profile.investments
}
