import type { SpaceCategory, SpaceIconId } from './types.js'

export interface CategoryDefaults {
  color: string
  icon: SpaceIconId
  encounterId: string
}

/** Defaults applied when JSON omits color, icon, or encounterId. */
export const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  career: { color: '#E84855', icon: 'briefcase', encounterId: 'promotion' },
  finance: { color: '#3B82F6', icon: 'wallet', encounterId: 'salary_increase' },
  opportunity: { color: '#10B981', icon: 'sparkles', encounterId: 'business_opportunity' },
  risk: { color: '#F97316', icon: 'alert', encounterId: 'vehicle_breakdown' },
  family: { color: '#EC4899', icon: 'heart', encounterId: 'marriage' },
  health: { color: '#14B8A6', icon: 'medical', encounterId: 'medical_expense' },
  business: { color: '#8B5CF6', icon: 'building', encounterId: 'business_opportunity' },
  investment: { color: '#EAB308', icon: 'chart', encounterId: 'investment' },
  education: { color: '#6366F1', icon: 'book', encounterId: 'education' },
  life_event: { color: '#A855F7', icon: 'star', encounterId: 'milestone' },
  milestone: { color: '#818CF8', icon: 'star', encounterId: 'milestone' },
  rest: { color: '#94A3B8', icon: 'moon', encounterId: 'rest' },
  bonus: { color: '#22C55E', icon: 'gift', encounterId: 'bonus' },
  community: { color: '#06B6D4', icon: 'users', encounterId: 'community' },
}

const FALLBACK_DEFAULTS: CategoryDefaults = {
  color: '#64748B',
  icon: 'star',
  encounterId: 'milestone',
}

export function defaultsForCategory(category: SpaceCategory): CategoryDefaults {
  return CATEGORY_DEFAULTS[category] ?? FALLBACK_DEFAULTS
}
