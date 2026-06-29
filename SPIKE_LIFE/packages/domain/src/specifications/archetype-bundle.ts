import type { ArchetypeConfig } from '@spike-life/content-core'
import type {
  Character,
  FinancialProfile,
  GoalPortfolio,
  ProtectionPortfolio,
} from '../entities/financial-state.js'

export interface ArchetypeBundle {
  character: Character
  financialProfile: FinancialProfile
  protectionPortfolio: ProtectionPortfolio
  goalPortfolio: GoalPortfolio
}

export function createBundleFromArchetypeConfig(config: ArchetypeConfig): ArchetypeBundle {
  return {
    character: {
      id: `char-${config.id}`,
      name: config.character.name,
      age: config.character.age,
      careerType: config.character.careerType,
      lifeStage: config.character.lifeStage,
      maritalStatus: config.character.maritalStatus,
      dependents: config.character.dependents,
      archetypeId: config.id,
    },
    financialProfile: { ...config.financialProfile },
    protectionPortfolio: { ...config.protectionPortfolio },
    goalPortfolio: {
      goals: config.goals.map((goal) => ({ ...goal })),
    },
  }
}
