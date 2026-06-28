import type { CurrencyConfig } from '@spike-life/content-core'
import type { Character } from '../entities/financial-state.js'
import type { FnaSnapshot } from './fna-engine.js'
import { formatAmount } from '../value-objects/money.js'
import { SolutionCategory, SolutionLabels, type PriorityLevel, type SolutionCategory as SolutionCategoryType } from '../types.js'

export interface Recommendation {
  rank: number
  solution: SolutionCategoryType
  label: string
  priority: PriorityLevel
  rationale: string
  addressesGap: string
}

interface Candidate {
  solution: SolutionCategoryType
  priority: PriorityLevel
  rationale: string
  addressesGap: string
  sortWeight: number
}

export function runRecommendationEngine(
  fna: FnaSnapshot,
  character: Character,
  currency: CurrencyConfig,
): Recommendation[] {
  const candidates: Candidate[] = []

  const emergencyGap = 1 - fna.emergencyFundProgress
  if (emergencyGap > 0.25) {
    candidates.push({
      solution: SolutionCategory.BUILD_EMERGENCY_FUND,
      priority: emergencyGap > 0.5 ? 'critical' : 'high',
      rationale: 'Emergency fund precedes aggressive investing (Recommendation Rule 3).',
      addressesGap: fna.gaps.find((g) => g.dimension === 'cashFlow')?.summary ?? 'Cash flow gap',
      sortWeight: emergencyGap * 100 + 50,
    })
  }

  if (fna.protectionScore < 75) {
    if (character.dependents > 0 || character.maritalStatus === 'married') {
      candidates.push({
        solution: SolutionCategory.STRENGTHEN_FAMILY_PROTECTION,
        priority: fna.protectionScore < 40 ? 'critical' : 'high',
        rationale: 'Protection precedes wealth building (Recommendation Rule 2).',
        addressesGap: `Family protection gap of ${formatAmount(fna.familyProtectionGap, currency)}.`,
        sortWeight: (100 - fna.protectionScore) + 40,
      })
    }

    candidates.push({
      solution: SolutionCategory.STRENGTHEN_HEALTH_PROTECTION,
      priority: fna.protectionScore < 40 ? 'critical' : 'high',
      rationale: 'Health protection reduces volatility from medical events.',
      addressesGap: `Health protection need: ${formatAmount(fna.healthProtectionNeed, currency)}.`,
      sortWeight: (100 - fna.protectionScore) + 30,
    })

    candidates.push({
      solution: SolutionCategory.PROTECT_INCOME,
      priority: fna.protectionScore < 50 ? 'high' : 'medium',
      rationale: 'Income protection supports earning ability.',
      addressesGap: 'Income interruption risk remains unaddressed.',
      sortWeight: (100 - fna.protectionScore) + 20,
    })
  }

  if (fna.debtScore < 60) {
    candidates.push({
      solution: SolutionCategory.REDUCE_UNSUSTAINABLE_DEBT,
      priority: fna.debtScore < 40 ? 'critical' : 'high',
      rationale: 'Debt stress reduces investment priority (Recommendation Rule 4).',
      addressesGap: fna.gaps.find((g) => g.dimension === 'debt')?.summary ?? 'Debt gap',
      sortWeight: (100 - fna.debtScore) + 35,
    })
  }

  if (character.dependents > 0) {
    candidates.push({
      solution: SolutionCategory.SECURE_EDUCATION_GOALS,
      priority: 'medium',
      rationale: 'Family obligations increase planning priority (Recommendation Rule 5).',
      addressesGap: 'Education funding may be exposed.',
      sortWeight: 25,
    })
  }

  if (fna.goalScore < 70) {
    candidates.push({
      solution: SolutionCategory.ACCELERATE_GOAL_FUNDING,
      priority: fna.goalScore < 40 ? 'high' : 'medium',
      rationale: 'Goals compete for limited resources — allocate intentionally.',
      addressesGap: fna.gaps.find((g) => g.dimension === 'goals')?.summary ?? 'Goal gap',
      sortWeight: (100 - fna.goalScore) + 15,
    })
  }

  if (fna.retirementScore < 50) {
    candidates.push({
      solution: SolutionCategory.STRENGTHEN_RETIREMENT_SECURITY,
      priority: fna.retirementScore < 25 ? 'high' : 'medium',
      rationale: 'Long-term security benefits from early contributions.',
      addressesGap: fna.gaps.find((g) => g.dimension === 'retirement')?.summary ?? 'Retirement gap',
      sortWeight: (100 - fna.retirementScore) + 10,
    })
  }

  candidates.push({
    solution: SolutionCategory.MAINTAIN_LIFESTYLE_DISCIPLINE,
    priority: 'medium',
    rationale: 'A raise is an opportunity to improve planning — not only lifestyle.',
    addressesGap: 'Lifestyle inflation risk after income increase.',
    sortWeight: 5,
  })

  const sorted = [...candidates].sort((a, b) => b.sortWeight - a.sortWeight)
  const seen = new Set<SolutionCategoryType>()

  return sorted
    .filter((c) => {
      if (seen.has(c.solution)) return false
      seen.add(c.solution)
      return true
    })
    .slice(0, 5)
    .map((c, index) => ({
      rank: index + 1,
      solution: c.solution,
      label: SolutionLabels[c.solution],
      priority: c.priority,
      rationale: c.rationale,
      addressesGap: c.addressesGap,
    }))
}
