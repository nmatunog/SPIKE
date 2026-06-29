import type { EncounterLifeChoice, EncounterRecord } from '@spike-life/content-core'
import type { DecisionStrategy } from '../types.js'

type ChoiceTemplate = Omit<EncounterLifeChoice, 'strategy'> & { strategy: DecisionStrategy }

function asChoices(templates: ChoiceTemplate[]): EncounterLifeChoice[] {
  return templates.map((t) => ({ ...t, strategy: t.strategy }))
}

const PROTECTION_STRESS_CHOICES: ChoiceTemplate[] = [
  {
    id: 'use_insurance',
    label: 'Use your health insurance',
    description: 'Claim through your HMO or medical plan.',
    costLabel: 'Deductible only',
    outcomePreview: 'Very low financial damage',
    strategy: 'improve_protection',
    tone: 'positive',
  },
  {
    id: 'pay_cash',
    label: 'Pay cash from savings',
    description: 'Cover the bill directly from your emergency fund.',
    costLabel: 'Full bill amount',
    outcomePreview: 'Emergency fund drops',
    strategy: 'maintain_lifestyle_discipline',
    tone: 'warning',
  },
  {
    id: 'borrow',
    label: 'Borrow or use credit',
    description: 'Finance the cost and repay over time.',
    costLabel: 'Bill + interest',
    outcomePreview: 'Debt may grow next cycles',
    strategy: 'reduce_debt',
    tone: 'warning',
  },
  {
    id: 'delay',
    label: 'Delay or minimize treatment',
    description: 'Postpone care to preserve cash today.',
    costLabel: 'No immediate cost',
    outcomePreview: 'Health risk and Life Score may fall',
    strategy: 'increase_lifestyle',
    tone: 'critical',
  },
]

const INCOME_OPPORTUNITY_CHOICES: ChoiceTemplate[] = [
  {
    id: 'accept',
    label: 'Say yes — take the opportunity',
    description: 'Move forward and figure out the money details after.',
    outcomePreview: 'Income or growth potential rises',
    strategy: 'split_allocation',
    tone: 'positive',
  },
  {
    id: 'negotiate',
    label: 'Negotiate better terms',
    description: 'Ask for more pay, equity, or flexibility before committing.',
    outcomePreview: 'Balanced upside with less risk',
    strategy: 'fund_goals',
    tone: 'neutral',
  },
  {
    id: 'stay',
    label: 'Stay where you are',
    description: 'Keep your current path and protect what you have built.',
    outcomePreview: 'Stability over upside',
    strategy: 'maintain_lifestyle_discipline',
    tone: 'neutral',
  },
  {
    id: 'decline',
    label: 'Decline for now',
    description: 'Pass on this and preserve cash and focus.',
    outcomePreview: 'Cash preserved; opportunity missed',
    strategy: 'increase_savings',
    tone: 'warning',
  },
]

const BY_DOMAIN: Record<string, ChoiceTemplate[]> = {
  career: INCOME_OPPORTUNITY_CHOICES,
  business: [
    {
      id: 'invest',
      label: 'Invest in the venture',
      description: 'Put real money behind the idea.',
      outcomePreview: 'Wealth may grow — or concentrate',
      strategy: 'fund_goals',
      tone: 'warning',
    },
    {
      id: 'partner',
      label: 'Partner with sweat equity',
      description: 'Join without full cash upfront.',
      outcomePreview: 'Shared risk and reward',
      strategy: 'split_allocation',
      tone: 'neutral',
    },
    {
      id: 'decline_biz',
      label: 'Decline politely',
      description: 'Protect your savings and current goals.',
      outcomePreview: 'Cash preserved',
      strategy: 'increase_savings',
      tone: 'neutral',
    },
    {
      id: 'research',
      label: 'Research first',
      description: 'Take time to validate before committing.',
      outcomePreview: 'Delay with less regret',
      strategy: 'maintain_lifestyle_discipline',
      tone: 'positive',
    },
  ],
  health: PROTECTION_STRESS_CHOICES,
  family: [
    {
      id: 'protect_family',
      label: 'Strengthen family protection',
      description: 'Increase insurance and safety nets first.',
      outcomePreview: 'Protection readiness improves',
      strategy: 'improve_protection',
      tone: 'positive',
    },
    {
      id: 'upgrade_home',
      label: 'Upgrade housing or space',
      description: 'Move or renovate for the growing household.',
      outcomePreview: 'Lifestyle cost may rise',
      strategy: 'increase_lifestyle',
      tone: 'warning',
    },
    {
      id: 'delay_other_goals',
      label: 'Delay other big goals',
      description: 'Pause business or travel plans for family needs.',
      outcomePreview: 'Goals shift timeline',
      strategy: 'fund_goals',
      tone: 'neutral',
    },
    {
      id: 'stay_course',
      label: 'Continue as planned',
      description: 'Absorb the change without major shifts.',
      outcomePreview: 'Moderate strain on cash flow',
      strategy: 'maintain_lifestyle_discipline',
      tone: 'neutral',
    },
  ],
  housing: [
    {
      id: 'buy_now',
      label: 'Buy or upgrade now',
      description: 'Commit to the property move.',
      outcomePreview: 'Net worth mix changes; debt may rise',
      strategy: 'fund_goals',
      tone: 'warning',
    },
    {
      id: 'negotiate_rent',
      label: 'Negotiate rent or terms',
      description: 'Push back on the increase or lease terms.',
      outcomePreview: 'May preserve monthly cash flow',
      strategy: 'maintain_lifestyle_discipline',
      tone: 'positive',
    },
    {
      id: 'move_cheaper',
      label: 'Move somewhere cheaper',
      description: 'Relocate to reduce housing pressure.',
      outcomePreview: 'Cash flow relief; lifestyle trade-off',
      strategy: 'increase_savings',
      tone: 'neutral',
    },
    {
      id: 'pay_increase',
      label: 'Pay the higher cost',
      description: 'Stay put and absorb the increase.',
      outcomePreview: 'Less room for savings each month',
      strategy: 'increase_lifestyle',
      tone: 'warning',
    },
  ],
  education: [
    {
      id: 'enroll_now',
      label: 'Enroll or upskill now',
      description: 'Invest in education despite the cost.',
      outcomePreview: 'Future income potential rises',
      strategy: 'fund_goals',
      tone: 'positive',
    },
    {
      id: 'scholarship',
      label: 'Seek scholarship or employer support',
      description: 'Reduce out-of-pocket before committing.',
      outcomePreview: 'Lower immediate cash impact',
      strategy: 'split_allocation',
      tone: 'positive',
    },
    {
      id: 'delay_edu',
      label: 'Delay the program',
      description: 'Wait until finances are stronger.',
      outcomePreview: 'Goal timeline slips',
      strategy: 'increase_savings',
      tone: 'neutral',
    },
    {
      id: 'part_time',
      label: 'Study part-time while working',
      description: 'Balance income and learning.',
      outcomePreview: 'Slower progress, less strain',
      strategy: 'maintain_lifestyle_discipline',
      tone: 'neutral',
    },
  ],
  lifestyle: [
    {
      id: 'treat_yourself',
      label: 'Treat yourself — you earned it',
      description: 'Spend on the experience or upgrade.',
      outcomePreview: 'Life satisfaction up; savings down',
      strategy: 'increase_lifestyle',
      tone: 'warning',
    },
    {
      id: 'budget_splurge',
      label: 'Splurge within a budget',
      description: 'Enjoy something meaningful without going overboard.',
      outcomePreview: 'Balanced joy and discipline',
      strategy: 'split_allocation',
      tone: 'neutral',
    },
    {
      id: 'skip_treat',
      label: 'Skip it and save instead',
      description: 'Redirect the money to goals or emergency fund.',
      outcomePreview: 'Savings strengthen',
      strategy: 'increase_savings',
      tone: 'positive',
    },
    {
      id: 'delay_purchase',
      label: 'Delay the purchase',
      description: 'Revisit when cash flow is clearer.',
      outcomePreview: 'No change today',
      strategy: 'maintain_lifestyle_discipline',
      tone: 'neutral',
    },
  ],
  investment: INCOME_OPPORTUNITY_CHOICES,
  income_finance: INCOME_OPPORTUNITY_CHOICES,
  community: INCOME_OPPORTUNITY_CHOICES,
  government: INCOME_OPPORTUNITY_CHOICES,
  milestone: [
    {
      id: 'celebrate',
      label: 'Celebrate meaningfully',
      description: 'Mark the milestone with a planned celebration.',
      outcomePreview: 'Morale up; some cash out',
      strategy: 'increase_lifestyle',
      tone: 'neutral',
    },
    {
      id: 'reinvest',
      label: 'Reinvest the windfall',
      description: 'Put gains toward goals and protection.',
      outcomePreview: 'Long-term position strengthens',
      strategy: 'fund_goals',
      tone: 'positive',
    },
    {
      id: 'save_milestone',
      label: 'Bank it all',
      description: 'Add everything to reserves.',
      outcomePreview: 'Emergency fund grows',
      strategy: 'increase_savings',
      tone: 'positive',
    },
    {
      id: 'balanced_milestone',
      label: 'Balance joy and planning',
      description: 'Celebrate modestly and allocate the rest.',
      outcomePreview: 'Life score and savings both benefit',
      strategy: 'split_allocation',
      tone: 'positive',
    },
  ],
}

const DEFAULT_CHOICES = INCOME_OPPORTUNITY_CHOICES

/** Four contextual life-language choices for an encounter; engine strategy stays hidden in UI. */
export function resolveLifeChoices(encounter: EncounterRecord): EncounterLifeChoice[] {
  if (encounter.lifeChoices?.length) {
    return encounter.lifeChoices.slice(0, 4)
  }
  if (encounter.situationKind === 'protection_stress') {
    return asChoices(PROTECTION_STRESS_CHOICES)
  }
  const domainChoices = BY_DOMAIN[encounter.domainId]
  if (domainChoices) {
    return asChoices(domainChoices)
  }
  return asChoices(DEFAULT_CHOICES)
}

export function lifeChoiceStrategies(encounter: EncounterRecord): DecisionStrategy[] {
  return resolveLifeChoices(encounter).map((c) => c.strategy as DecisionStrategy)
}
