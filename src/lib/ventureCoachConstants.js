/** AI Venture Coach™ — section registry and card options */

export const COACH_SECTIONS = [
  { id: 'ambition', label: 'My Ambition', route: 'ambition', badge: 'Ambition Defined' },
  { id: 'purpose', label: 'My Purpose', route: 'purpose', badge: 'Purpose Discovered' },
  { id: 'values', label: 'My Values', route: 'values', badge: 'Values Identified' },
  { id: 'tagline', label: 'My Tagline', route: 'tagline', badge: 'Tagline Created' },
  { id: 'future-self', label: 'My Future Self', route: 'future-self', badge: 'Future Self Designed' },
  {
    id: 'venture-direction',
    label: 'My Venture Direction',
    route: 'venture-direction',
    badge: 'Venture Direction Selected',
  },
];

export const WORD_LIMITS = {
  ambition: { max: 25, targetMin: 12, targetMax: 20 },
  purpose: { max: 20, targetMin: 10, targetMax: 15 },
  valuesProfile: { max: 40 },
  tagline: { max: 8, targetMin: 3, targetMax: 6 },
  futureSelf: { min: 250, max: 400 },
  futureSelfSummary: { max: 25 },
};

export const AMBITION_MOTIVATOR_CARDS = [
  { id: 'financial_freedom', label: 'Financial Freedom' },
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'helping_others', label: 'Helping Others' },
  { id: 'building_wealth', label: 'Building Wealth' },
  { id: 'professional_expertise', label: 'Professional Expertise' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'travel', label: 'Travel' },
  { id: 'impact', label: 'Impact' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'innovation', label: 'Innovation' },
];

export const PURPOSE_DRIVERS = [
  { id: 'family', label: 'Family' },
  { id: 'impact', label: 'Impact' },
  { id: 'service', label: 'Service' },
  { id: 'freedom', label: 'Freedom' },
  { id: 'growth', label: 'Growth' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'security', label: 'Security' },
  { id: 'community', label: 'Community' },
  { id: 'success', label: 'Success' },
  { id: 'learning', label: 'Learning' },
];

export const COACH_VALUE_CARDS = [
  { id: 'integrity', label: 'Integrity' },
  { id: 'growth', label: 'Growth' },
  { id: 'service', label: 'Service' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'excellence', label: 'Excellence' },
  { id: 'accountability', label: 'Accountability' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'family', label: 'Family' },
  { id: 'freedom', label: 'Freedom' },
  { id: 'respect', label: 'Respect' },
  { id: 'learning', label: 'Learning' },
  { id: 'courage', label: 'Courage' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'impact', label: 'Impact' },
  { id: 'collaboration', label: 'Collaboration' },
];

export const FUTURE_SELF_GOALS = [
  { id: 'leading_team', label: 'Leading a Team' },
  { id: 'building_business', label: 'Building a Business' },
  { id: 'becoming_expert', label: 'Becoming an Expert' },
  { id: 'financially_independent', label: 'Financially Independent' },
  { id: 'owning_assets', label: 'Owning Assets' },
  { id: 'creating_impact', label: 'Creating Impact' },
  { id: 'traveling', label: 'Traveling' },
  { id: 'supporting_family', label: 'Supporting Family' },
];

export const INCOME_SLIDER_LABELS = [
  { value: 1, label: 'Comfortable living' },
  { value: 2, label: 'Above average' },
  { value: 3, label: 'High performer' },
  { value: 4, label: 'Top tier in my market' },
  { value: 5, label: 'Financial freedom level' },
];

export const VENTURE_DIRECTION_CARDS = [
  {
    id: 'agency_builder',
    label: 'Agency Builder',
    description: 'Build a team. Develop leaders. Create an agency.',
  },
  {
    id: 'specialist_consultant',
    label: 'Specialist Consultant',
    description: 'Develop expertise. Build a niche practice. Become a trusted advisor.',
  },
  {
    id: 'undecided',
    label: 'Still Exploring',
    description: 'Not ready to choose — keep exploring your options.',
  },
];

export const AMBITION_VARIANTS = [
  { id: 'short', label: 'Short' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'inspirational', label: 'Inspirational' },
];

export const IDENTITY_REFINE_ACTIONS = [
  { id: 'shorten', label: 'Shorter' },
  { id: 'ambitious', label: 'More Ambitious' },
  { id: 'personal', label: 'More Personal' },
  { id: 'professional', label: 'More Professional' },
  { id: 'inspirational', label: 'More Inspirational' },
  { id: 'rewrite', label: 'Rewrite' },
];

/** @deprecated Use IDENTITY_REFINE_ACTIONS */
export const REFINE_ACTIONS = IDENTITY_REFINE_ACTIONS;

export const FUTURE_SELF_REFINE_ACTIONS = [
  { id: 'ambitious', label: 'More Ambitious' },
  { id: 'realistic', label: 'More Realistic' },
  { id: 'inspirational', label: 'More Inspirational' },
  { id: 'shorten', label: 'Shorter' },
  { id: 'longer', label: 'Longer' },
  { id: 'rewrite', label: 'Rewrite' },
];

export const COACH_WELCOME = `Hello, I am your SPIKE Venture Coach.

My role is to help you discover:

• What future excites you
• What motivates you
• What values guide you
• A memorable tagline and future self story

There are no right or wrong answers — only clearer choices.

Let's begin.`;
