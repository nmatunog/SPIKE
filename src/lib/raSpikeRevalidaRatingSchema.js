/** Shared Revalida panel rating schema — web form + PDF export. */

export const REVALIDA_RATING_OPTIONS = {
  fvp: [12, 14, 16, 18, 20],
  business_model: [15, 17.5, 20, 22.5, 25],
  strategy: [12, 14, 16, 18, 20],
  presentation: [12, 14, 16, 18, 20],
  investment: [9, 10.5, 12, 13.5, 15],
};

export const REVALIDA_CRITERIA = [
  {
    key: 'fvp',
    title: 'Financial Value Proposition',
    description: 'Clear, relevant, customer-focused and compelling.',
    max: 20,
  },
  {
    key: 'business_model',
    title: 'Business Model',
    description: 'Revenue Engine and Leadership Engine are practical, executable and scalable.',
    max: 25,
  },
  {
    key: 'strategy',
    title: 'Strategy & Planning',
    description: 'MAPA projections, milestones and monitoring system are realistic and aligned.',
    max: 20,
  },
  {
    key: 'presentation',
    title: 'Presentation & Defense',
    description: 'Clear, confident, cohesive, and demonstrates understanding of the business.',
    max: 20,
  },
  {
    key: 'investment',
    title: 'Investment Potential',
    description: 'Overall entrepreneurial viability — would you back this venture?',
    max: 15,
  },
];

export const REVALIDA_RECOMMENDATIONS = [
  { value: 'ready', label: 'Ready for Segment 2' },
  { value: 'ready_with_revisions', label: 'Ready with Minor Revisions' },
  { value: 'needs_development', label: 'Needs Further Development' },
];
