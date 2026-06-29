/**
 * SPIKE LIFE illustration system — domain identity tokens.
 * Hero SVGs per domain; situations reuse hero + overlay badge.
 */

export const DOMAIN_IDENTITY = {
  career: {
    label: 'Career',
    color: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.45)',
    subtitle: 'Jobs & Growth',
  },
  business: {
    label: 'Business',
    color: '#FF8C42',
    glow: 'rgba(255, 140, 66, 0.45)',
    subtitle: 'Build & Grow',
  },
  income_finance: {
    label: 'Income & Finance',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    subtitle: 'Earn & Manage',
  },
  family: {
    label: 'Family',
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.45)',
    subtitle: 'Love & Support',
  },
  health: {
    label: 'Health',
    color: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.45)',
    subtitle: 'Body & Mind',
  },
  housing: {
    label: 'Housing',
    color: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.45)',
    subtitle: 'Live & Own',
  },
  education: {
    label: 'Education',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    subtitle: 'Learn & Grow',
  },
  lifestyle: {
    label: 'Lifestyle',
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    subtitle: 'Enjoy & Balance',
  },
  community: {
    label: 'Community',
    color: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.45)',
    subtitle: 'Give & Belong',
  },
  government: {
    label: 'Government',
    color: '#64748B',
    glow: 'rgba(100, 116, 139, 0.4)',
    subtitle: 'Civic & Society',
  },
  investment: {
    label: 'Investment',
    color: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.45)',
    subtitle: 'Invest & Multiply',
  },
  milestone: {
    label: 'Milestone',
    color: '#D946EF',
    glow: 'rgba(217, 70, 239, 0.45)',
    subtitle: 'Celebrate & Achieve',
  },
  chance: {
    label: 'Chance',
    color: '#FACC15',
    glow: 'rgba(250, 204, 21, 0.45)',
    subtitle: 'Unexpected turns',
  },
}

export function resolveDomainIdentity(domainId, fallbackLabel = 'Life') {
  return (
    DOMAIN_IDENTITY[domainId] ?? {
      label: fallbackLabel,
      color: '#6366F1',
      glow: 'rgba(99, 102, 241, 0.4)',
      subtitle: '',
    }
  )
}

/** Dream board goal illustration keys */
export const DREAM_GOAL_ILLUSTRATIONS = {
  home: 'house',
  travel: 'travel',
  education: 'education',
  business: 'business',
  retirement: 'retirement',
  emergency: 'shield',
}
