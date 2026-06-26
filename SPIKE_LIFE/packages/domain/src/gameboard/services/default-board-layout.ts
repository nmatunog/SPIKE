import type { BoardSpace } from '../types.js'

/** Sixteen-space circular track — each space routes to an encounter, never financial logic. */
export const DEFAULT_BOARD_SPACES: BoardSpace[] = [
  { index: 0, type: 'career', encounterId: 'promotion', label: 'Career Lift' },
  { index: 1, type: 'finance', encounterId: 'salary_increase', label: 'Paycheck' },
  { index: 2, type: 'opportunity', encounterId: 'business_opportunity', label: 'Opportunity' },
  { index: 3, type: 'risk', encounterId: 'vehicle_breakdown', label: 'Unexpected Cost' },
  { index: 4, type: 'family', encounterId: 'marriage', label: 'Family' },
  { index: 5, type: 'health', encounterId: 'medical_expense', label: 'Health' },
  { index: 6, type: 'business', encounterId: 'business_opportunity', label: 'Business' },
  { index: 7, type: 'investment', encounterId: 'investment', label: 'Invest' },
  { index: 8, type: 'education', encounterId: 'education', label: 'Learn' },
  { index: 9, type: 'life_event', encounterId: 'milestone', label: 'Milestone' },
  { index: 10, type: 'rest', encounterId: 'rest', label: 'Rest' },
  { index: 11, type: 'bonus', encounterId: 'bonus', label: 'Bonus' },
  { index: 12, type: 'community', encounterId: 'community', label: 'Community' },
  { index: 13, type: 'finance', encounterId: 'inflation', label: 'Inflation' },
  { index: 14, type: 'risk', encounterId: 'job_loss', label: 'Job Risk' },
  { index: 15, type: 'milestone', encounterId: 'economic_boom', label: 'Boom' },
]

export function spaceAt(spaces: BoardSpace[], index: number): BoardSpace {
  const normalized = ((index % spaces.length) + spaces.length) % spaces.length
  return spaces[normalized]!
}

export function advancePosition(current: number, steps: number, spaceCount: number): number {
  return (current + steps) % spaceCount
}
