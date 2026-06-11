/** Curated phrase bank for deterministic identity statement composition (no free-text input). */

export const AMBITION_ROLE_ARCHETYPES = [
  { id: 'agency_director', label: 'Agency Director' },
  { id: 'unit_manager', label: 'Unit Manager' },
  { id: 'associate_unit_manager', label: 'Associate Unit Manager' },
  { id: 'senior_leader', label: 'Senior Leader' },
  { id: 'senior_unit_manager', label: 'Senior Unit Manager' },
  { id: 'trusted_advisor', label: 'Trusted Advisor' },
  { id: 'financial_advisor', label: 'Financial Advisor' },
  { id: 'wealth_strategist', label: 'Wealth Strategist' },
  { id: 'venture_builder', label: 'Venture Builder' },
  { id: 'team_leader', label: 'Team Leader' },
  { id: 'practice_owner', label: 'Practice Owner' },
  { id: 'market_leader', label: 'Market Leader' },
  { id: 'custom', label: 'My own role (1–3 words)' },
];

export const CUSTOM_ROLE_ARCHETYPE_ID = 'custom';

/** @param {string} input */
export function sanitizeCustomRolePhrase(input) {
  const cleaned = String(input ?? '')
    .trim()
    .replace(/[^A-Za-z\s'-]/g, '')
    .replace(/\s+/g, ' ');
  const words = cleaned.split(' ').filter(Boolean);
  if (!words.length) {
    return { valid: false, phrase: '', error: 'Enter your role — one word or up to three words.' };
  }
  if (words.length > 3) {
    return { valid: false, phrase: '', error: 'Use at most 3 words for your role.' };
  }
  const phrase = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return { valid: true, phrase, error: '' };
}

export const IMPACT_SENTENCE_PATTERNS = [
  'Help {primaryAudience} achieve {primaryOutcome} through trusted financial guidance.',
  'Serve {primaryAudience} and {secondaryAudience} with meaningful financial guidance.',
  'Empower {primaryAudience} to build {primaryOutcome} with clarity and confidence.',
  'Guide {primaryAudience} toward {primaryOutcome} while strengthening {secondaryTheme}.',
  'Create lasting impact for {primaryAudience} through disciplined financial planning.',
  'Support {primaryAudience} and {secondaryAudience} in reaching {primaryOutcome}.',
];

export const FUTURE_SELF_SUMMARY_PATTERNS = [
  'In three years, I am a respected entrepreneur focused on {primaryGoal}, creating {impact} at a {income} level.',
  'My future self leads a thriving venture centered on {primaryGoal}, delivering {impact} with {income} results.',
  'Within three years, I build a credible practice around {primaryGoal}, helping others through {impact}.',
  'I become a confident venture builder known for {primaryGoal}, {impact}, and sustainable {income} growth.',
  'Three years from now, I am recognized for {primaryGoal} while creating {impact} at a {income} standard.',
  'I grow into a leader who advances {primaryGoal}, drives {impact}, and earns {income} with integrity.',
];

/** @type {Record<string, { theme: string, verb: string, outcome: string, accent: string }>} */
export const AMBITION_KEYWORD_PHRASES = {
  entrepreneurship: {
    theme: 'entrepreneurship',
    verb: 'build ventures that scale',
    outcome: 'sustainable businesses',
    accent: 'innovation',
  },
  leadership: {
    theme: 'leadership',
    verb: 'develops leaders who deliver results',
    outcome: 'high-performing organizations',
    accent: 'influence',
  },
  financial_freedom: {
    theme: 'financial freedom',
    verb: 'create disciplined wealth strategies',
    outcome: 'lasting financial security',
    accent: 'independence',
  },
  professional_expertise: {
    theme: 'professional expertise',
    verb: 'master my craft with excellence',
    outcome: 'trusted advisory relationships',
    accent: 'credibility',
  },
  business_ownership: {
    theme: 'business ownership',
    verb: 'own and grow a resilient practice',
    outcome: 'a business I am proud to lead',
    accent: 'ownership',
  },
  building_team: {
    theme: 'team building',
    verb: 'recruit and develop talented advisors',
    outcome: 'teams that grow together',
    accent: 'collaboration',
  },
  recognition: {
    theme: 'recognized excellence',
    verb: 'earn trust through consistent performance',
    outcome: 'a reputation built on results',
    accent: 'distinction',
  },
  legacy: {
    theme: 'lasting legacy',
    verb: 'create impact that outlasts my career',
    outcome: 'organizations that endure',
    accent: 'generational impact',
  },
  personal_growth: {
    theme: 'continuous growth',
    verb: 'stretch my capabilities every season',
    outcome: 'a career of meaningful progress',
    accent: 'resilience',
  },
  independence: {
    theme: 'independence',
    verb: 'lead on my own terms with discipline',
    outcome: 'freedom to serve clients well',
    accent: 'self-direction',
  },
};

export const AMBITION_TONE_OPTIONS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'leadership_forward', label: 'Leadership-forward' },
  { id: 'builder_focused', label: 'Builder-focused' },
];

/** @type {Record<'short' | 'balanced' | 'inspirational', string[]>} */
export const AMBITION_SENTENCE_PATTERNS = {
  short: [
    'Become {roleArticle} focused on {primaryTheme}.',
    'Become {roleArticle} known for {primaryTheme}.',
    'I aim to be {roleArticle} who champions {primaryTheme}.',
    'My ambition: {roleArticle} centered on {primaryTheme}.',
    'Become {roleArticle} driven by {primaryTheme}.',
    'I will grow into {roleArticle} defined by {primaryTheme}.',
  ],
  balanced: [
    'Become {roleArticle} who {primaryVerb}, guided by {secondaryTheme} and {tertiaryTheme}.',
    'Become {roleArticle} who {primaryVerb} while building on {secondaryTheme} and {tertiaryTheme}.',
    'I aim to become {roleArticle} who {primaryVerb}, with {secondaryTheme} and {tertiaryTheme} as my compass.',
    'Become a respected {role} who {primaryVerb} and honors {secondaryTheme} and {tertiaryTheme}.',
    'My ambition is to be {roleArticle} who {primaryVerb}, strengthened by {secondaryTheme} and {tertiaryTheme}.',
    'Become {roleArticle} committed to {primaryTheme}, {secondaryTheme}, and {tertiaryTheme}.',
  ],
  inspirational: [
    'Become an influential {role} who {primaryVerb} and leaves {primaryOutcome}.',
    'Become a visionary {role} who {primaryVerb}, inspired by {secondaryTheme} and {tertiaryTheme}.',
    'I will become {roleArticle} who {primaryVerb} and creates {primaryOutcome} through {secondaryTheme}.',
    'Become {roleArticle} who inspires others through {primaryTheme}, {secondaryTheme}, and {tertiaryTheme}.',
    'My ambition is to be {roleArticle} who {primaryVerb} and builds {primaryOutcome} for generations.',
    'Become {roleArticle} whose {primaryTheme} fuels {primaryOutcome} and lasting {tertiaryTheme}.',
  ],
};

/** Tone swaps for verb/outcome slots — all curated. */
export const AMBITION_TONE_VERB_SWAPS = {
  balanced: null,
  leadership_forward: {
    entrepreneurship: 'develops leaders who build ventures',
    leadership: 'develops leaders who raise the bar',
    building_team: 'develops leaders who multiply talent',
    legacy: 'develops leaders who carry the mission forward',
    default: 'develops leaders who deliver excellence',
  },
  builder_focused: {
    entrepreneurship: 'builds teams and ventures that scale',
    business_ownership: 'builds a practice and team to be proud of',
    building_team: 'builds teams that grow production together',
    financial_freedom: 'builds wealth systems for families and teams',
    default: 'builds organizations that grow sustainably',
  },
};
