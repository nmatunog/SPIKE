import { describe, expect, it } from 'vitest'
import type { ArchetypePackConfig } from './archetype-types.js'
import { validateArchetypePackConfig } from './archetype-validation.js'

const baseArchetype = {
  label: 'Fresh Graduate',
  tagline: 'First job',
  fnaPriority: 'Cash flow',
  character: {
    name: 'Alex',
    age: 22,
    careerType: 'employee' as const,
    lifeStage: 'launch' as const,
    maritalStatus: 'single' as const,
    dependents: 0,
  },
  financialProfile: {
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
  },
  protectionPortfolio: {
    lifeCover: 0,
    criticalIllnessCover: 0,
    medicalCover: 0,
    accidentCover: 0,
    incomeProtectionCover: 0,
  },
  goals: [
    {
      goalId: 'emergency_fund',
      goalName: 'Emergency Fund',
      targetAmount: 90_000,
      targetAge: 24,
      currentFunding: 10_000,
      status: 'active' as const,
    },
  ],
}

const minimal: ArchetypePackConfig = {
  archetypes: ['a', 'b', 'c', 'd', 'e', 'f'].map((suffix) => ({
    ...baseArchetype,
    id: `persona_${suffix}`,
    label: `Persona ${suffix.toUpperCase()}`,
    character: { ...baseArchetype.character, name: `Player ${suffix.toUpperCase()}` },
  })),
  assignment: { mode: 'random_unique', minPlayers: 2, maxPlayers: 6 },
}

describe('validateArchetypePackConfig', () => {
  it('accepts a valid pack', () => {
    expect(() => validateArchetypePackConfig(minimal)).not.toThrow()
  })

  it('rejects duplicate archetype ids', () => {
    const dup = {
      ...minimal,
      archetypes: [...minimal.archetypes, { ...minimal.archetypes[0]! }],
    }
    expect(() => validateArchetypePackConfig(dup)).toThrow(/duplicate/i)
  })
})
