/** Space-type legend — shared by board rendering and sidebar cards. */
export const SPACE_TYPE_LEGEND = [
  { type: 'career', label: 'Career', color: '#8B0000' },
  { type: 'finance', label: 'Finance', color: '#1d4ed8' },
  { type: 'life_event', label: 'Life Event', color: '#9333ea' },
  { type: 'opportunity', label: 'Opportunity', color: '#047857' },
  { type: 'risk', label: 'Risk', color: '#b45309' },
  { type: 'rest', label: 'Rest', color: '#64748b' },
  { type: 'milestone', label: 'Milestone', color: '#4f46e5' },
]

export const SPACE_TYPE_COLORS = Object.fromEntries(
  [
    ['career', '#8B0000'],
    ['finance', '#1d4ed8'],
    ['opportunity', '#047857'],
    ['risk', '#b45309'],
    ['family', '#be185d'],
    ['health', '#0d9488'],
    ['business', '#7c3aed'],
    ['investment', '#ca8a04'],
    ['education', '#2563eb'],
    ['life_event', '#9333ea'],
    ['milestone', '#4f46e5'],
    ['rest', '#64748b'],
    ['bonus', '#16a34a'],
    ['community', '#0891b2'],
  ],
)
