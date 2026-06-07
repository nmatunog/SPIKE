/** AI Venture Coach™ — section registry and card options */

export const COACH_SECTIONS = [
  { id: 'ambition', label: 'My Ambition', route: 'ambition', badge: 'Ambition Defined' },
  { id: 'impact', label: 'My Impact', route: 'impact', badge: 'Impact Defined' },
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
  ambition: { max: 25, targetMin: 12, targetMax: 18 },
  impact: { max: 20, targetMin: 8, targetMax: 15 },
  /** @deprecated Use WORD_LIMITS.impact */
  purpose: { max: 20, targetMin: 8, targetMax: 15 },
  valuesProfile: { max: 40 },
  tagline: { max: 8, targetMin: 3, targetMax: 6 },
  futureSelf: { min: 250, max: 400 },
  futureSelfSummary: { max: 25 },
};

export const AMBITION_MOTIVATOR_CARDS = [
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'financial_freedom', label: 'Financial Freedom' },
  { id: 'professional_expertise', label: 'Professional Expertise' },
  { id: 'business_ownership', label: 'Business Ownership' },
  { id: 'building_team', label: 'Building a Team' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'personal_growth', label: 'Personal Growth' },
  { id: 'independence', label: 'Independence' },
];

export const IMPACT_AUDIENCES = [
  { id: 'families', label: 'Families' },
  { id: 'young_professionals', label: 'Young Professionals' },
  { id: 'entrepreneurs', label: 'Entrepreneurs' },
  { id: 'students', label: 'Students' },
  { id: 'ofws', label: 'OFWs' },
  { id: 'business_owners', label: 'Business Owners' },
  { id: 'healthcare_professionals', label: 'Healthcare Professionals' },
  { id: 'communities', label: 'Communities' },
  { id: 'future_leaders', label: 'Future Leaders' },
  { id: 'my_family', label: 'My Family' },
];

/** @deprecated Use IMPACT_AUDIENCES */
export const PURPOSE_DRIVERS = IMPACT_AUDIENCES;

export const COACH_VALUE_CARDS = [
  { id: 'integrity', label: 'Integrity' },
  { id: 'service', label: 'Service' },
  { id: 'growth', label: 'Growth' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'excellence', label: 'Excellence' },
  { id: 'accountability', label: 'Accountability' },
  { id: 'respect', label: 'Respect' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'courage', label: 'Courage' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'learning', label: 'Learning' },
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
  { id: 'simplify', label: 'Make Simpler', tooltip: 'Say the same thing with fewer words.' },
  { id: 'core', label: 'Find the Core Idea', tooltip: 'Distill to one central idea you can remember and repeat.' },
  { id: 'ambitious', label: 'Think Bigger', tooltip: 'Increase scale, impact, and leadership scope.' },
  { id: 'personal', label: 'Make It About Me', tooltip: 'Shift to personal motivation and why it matters.' },
  { id: 'professional', label: 'Sound More Professional', tooltip: 'Increase credibility and executive tone.' },
  { id: 'inspirational', label: 'Inspire Others', tooltip: 'Increase aspiration, meaning, and impact language.' },
  { id: 'rewrite', label: 'Rewrite', tooltip: 'Restructure while keeping your core message.' },
];

/** @deprecated Use IDENTITY_REFINE_ACTIONS */
export const REFINE_ACTIONS = IDENTITY_REFINE_ACTIONS;

export const FUTURE_SELF_REFINE_ACTIONS = [
  { id: 'ambitious', label: 'Think Bigger', tooltip: 'Increase scale, impact, and leadership scope.' },
  { id: 'realistic', label: 'More Realistic', tooltip: 'Ground the narrative in achievable milestones.' },
  { id: 'inspirational', label: 'Inspire Others', tooltip: 'Increase aspiration and meaning.' },
  { id: 'shorten', label: 'Make Simpler', tooltip: 'Tighten sentences without losing your core story.' },
  { id: 'longer', label: 'Add Detail', tooltip: 'Expand with specific milestones and examples.' },
  { id: 'rewrite', label: 'Rewrite', tooltip: 'Restructure while keeping your core message.' },
];

export const COACH_WELCOME = `Hello, I am your SPIKE Venture Coach.

My role is to help you discover:

• What you want to become (Ambition)
• Who you want to help (Impact)
• How you will do it (Values)
• A memorable tagline and future self story

There are no right or wrong answers — only clearer choices.

Let's begin.`;

export const IDENTITY_TRIANGLE = {
  ambition: { label: 'Ambition', subtitle: 'What I want to become' },
  impact: { label: 'Impact', subtitle: 'Who I want to help' },
  values: { label: 'Values', subtitle: 'How I will do it' },
};
