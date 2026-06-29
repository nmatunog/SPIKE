import type { CareerType, LifeStage } from './archetype-domain-shim.js'

export interface ArchetypeCharacterConfig {
  name: string
  age: number
  careerType: CareerType
  lifeStage: LifeStage
  maritalStatus: 'single' | 'married'
  dependents: number
}

export interface ArchetypeFinancialConfig {
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

export interface ArchetypeProtectionConfig {
  lifeCover: number
  criticalIllnessCover: number
  medicalCover: number
  accidentCover: number
  incomeProtectionCover: number
}

export interface ArchetypeGoalConfig {
  goalId: string
  goalName: string
  targetAmount: number
  targetAge: number
  currentFunding: number
  status: 'active' | 'completed'
}

export interface ArchetypeConfig {
  id: string
  label: string
  tagline: string
  fnaPriority: string
  character: ArchetypeCharacterConfig
  financialProfile: ArchetypeFinancialConfig
  protectionPortfolio: ArchetypeProtectionConfig
  goals: ArchetypeGoalConfig[]
}

export interface ArchetypeAssignmentConfig {
  mode: 'random_unique'
  minPlayers: number
  maxPlayers: number
}

export interface ArchetypePackConfig {
  archetypes: ArchetypeConfig[]
  assignment: ArchetypeAssignmentConfig
}
