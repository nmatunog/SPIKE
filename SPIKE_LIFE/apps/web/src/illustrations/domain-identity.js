/**
 * SPIKE LIFE illustration system — domain identity tokens.
 * Hero SVGs per domain; situations reuse hero + overlay badge.
 */

export const DOMAIN_IDENTITY = {
  career: {
    label: 'Career',
    color: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.45)',
    subtitle: 'Work & growth',
  },
  business: {
    label: 'Business',
    color: '#FF8C42',
    glow: 'rgba(255, 140, 66, 0.45)',
    subtitle: 'Ventures & income',
  },
  income_finance: {
    label: 'Income & Finance',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    subtitle: 'Cash & wealth',
  },
  family: {
    label: 'Family',
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.45)',
    subtitle: 'Home & relationships',
  },
  health: {
    label: 'Health',
    color: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.45)',
    subtitle: 'Body & protection',
  },
  housing: {
    label: 'Housing',
    color: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.45)',
    subtitle: 'Shelter & property',
  },
  education: {
    label: 'Education',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    subtitle: 'Learning & skills',
  },
  lifestyle: {
    label: 'Lifestyle',
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    subtitle: 'Life & choices',
  },
  community: {
    label: 'Community',
    color: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.45)',
    subtitle: 'People & giving',
  },
  government: {
    label: 'Government',
    color: '#64748B',
    glow: 'rgba(100, 116, 139, 0.4)',
    subtitle: 'Taxes & benefits',
  },
  investment: {
    label: 'Investment',
    color: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.45)',
    subtitle: 'Grow your money',
  },
  milestone: {
    label: 'Milestone',
    color: '#D946EF',
    glow: 'rgba(217, 70, 239, 0.45)',
    subtitle: 'Life moments',
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
