/** User-facing solution categories — never insurance product names. */
export const SolutionCategory = {
  BUILD_EMERGENCY_FUND: 'BUILD_EMERGENCY_FUND',
  STRENGTHEN_FAMILY_PROTECTION: 'STRENGTHEN_FAMILY_PROTECTION',
  STRENGTHEN_HEALTH_PROTECTION: 'STRENGTHEN_HEALTH_PROTECTION',
  PROTECT_INCOME: 'PROTECT_INCOME',
  SECURE_EDUCATION_GOALS: 'SECURE_EDUCATION_GOALS',
  STRENGTHEN_RETIREMENT_SECURITY: 'STRENGTHEN_RETIREMENT_SECURITY',
  REDUCE_UNSUSTAINABLE_DEBT: 'REDUCE_UNSUSTAINABLE_DEBT',
  ACCELERATE_GOAL_FUNDING: 'ACCELERATE_GOAL_FUNDING',
  MAINTAIN_LIFESTYLE_DISCIPLINE: 'MAINTAIN_LIFESTYLE_DISCIPLINE',
} as const

export type SolutionCategory =
  (typeof SolutionCategory)[keyof typeof SolutionCategory]

export const SolutionLabels: Record<SolutionCategory, string> = {
  [SolutionCategory.BUILD_EMERGENCY_FUND]: 'Build Emergency Fund',
  [SolutionCategory.STRENGTHEN_FAMILY_PROTECTION]: 'Strengthen Family Protection Plan',
  [SolutionCategory.STRENGTHEN_HEALTH_PROTECTION]: 'Strengthen Health Protection Plan',
  [SolutionCategory.PROTECT_INCOME]: 'Protect Your Income',
  [SolutionCategory.SECURE_EDUCATION_GOALS]: 'Secure Education Goals',
  [SolutionCategory.STRENGTHEN_RETIREMENT_SECURITY]: 'Strengthen Retirement Security',
  [SolutionCategory.REDUCE_UNSUSTAINABLE_DEBT]: 'Reduce Unsustainable Debt',
  [SolutionCategory.ACCELERATE_GOAL_FUNDING]: 'Accelerate Goal Funding',
  [SolutionCategory.MAINTAIN_LIFESTYLE_DISCIPLINE]: 'Maintain Lifestyle Discipline',
}

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

export type DecisionStrategy =
  | 'increase_lifestyle'
  | 'increase_savings'
  | 'reduce_debt'
  | 'improve_protection'
  | 'fund_goals'
  | 'split_allocation'
  | 'maintain_lifestyle_discipline'

export type CyclePhase =
  | 'created'
  | 'situation_presented'
  | 'discovery_complete'
  | 'decision_pending'
  | 'consequences_applied'
  | 'reflection_complete'
  | 'cycle_complete'

export type LifeStage = 'launch' | 'build' | 'grow' | 'lead' | 'legacy'

export type CareerType =
  | 'employee'
  | 'professional'
  | 'freelancer'
  | 'entrepreneur'
  | 'advisor'
  | 'hybrid'
