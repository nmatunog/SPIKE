const TYPE_IMPACTS = {
  career: ['Cash Flow', 'Goals'],
  finance: ['Cash Flow', 'Risk'],
  opportunity: ['Cash Flow', 'Goals', 'Risk'],
  risk: ['Cash Flow', 'Protection', 'Risk'],
  family: ['Protection', 'Goals'],
  health: ['Protection', 'Cash Flow'],
  business: ['Cash Flow', 'Goals', 'Risk'],
  investment: ['Goals', 'Risk'],
  education: ['Goals', 'Cash Flow'],
  life_event: ['Goals', 'Protection'],
  milestone: ['Goals'],
  rest: ['Cash Flow'],
  bonus: ['Cash Flow', 'Goals'],
  community: ['Goals'],
}

export function impactTagsForSpaceType(type) {
  return TYPE_IMPACTS[type] ?? ['Cash Flow']
}
