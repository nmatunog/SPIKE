/** Venture Blueprint Builders™ — Day 1 constants */

export const DAY1_BUILDERS = [
  {
    id: 'ambition-builder',
    label: 'My Ambition',
    missionLabel: 'AI Coach — My Ambition',
    description: 'Your Venture Coach guides you through a conversation — no blank forms.',
    feeds: 'Ambition & Purpose',
    coachSection: 'ambition',
  },
  {
    id: 'purpose-builder',
    label: 'My Purpose',
    missionLabel: 'AI Coach — My Purpose',
    description: 'Discover why your ambition matters through guided reflection.',
    feeds: 'Ambition & Purpose',
    coachSection: 'purpose',
  },
  {
    id: 'values-builder',
    label: 'My Values',
    missionLabel: 'AI Coach — My Values',
    description: 'Select, rank, and understand your guiding principles.',
    feeds: 'Ambition & Purpose',
    coachSection: 'values',
  },
  {
    id: 'tagline-builder',
    label: 'My Tagline',
    missionLabel: 'AI Coach — My Tagline',
    description: 'Distill your identity into a memorable phrase for your profile and presentations.',
    feeds: 'Ambition & Purpose',
    coachSection: 'tagline',
  },
  {
    id: 'future-self',
    label: 'My Future Self',
    missionLabel: 'AI Coach — Future Self',
    description: 'Build your 3-year narrative through an interactive timeline.',
    feeds: 'Ambition & Purpose',
    coachSection: 'future-self',
  },
  {
    id: 'dream-board',
    label: 'Dream Board Studio',
    missionLabel: 'Create Your Dream Board',
    description: 'Visualize lifestyle, family, career, and financial goals.',
    feeds: 'Ambition & Purpose',
  },
  {
    id: 'future-venture',
    label: 'My Venture Direction',
    missionLabel: 'AI Coach — Venture Direction',
    description: 'Explore which ACS path excites you — no commitment yet.',
    feeds: 'Career Track Explorer',
    coachSection: 'venture-direction',
  },
  {
    id: 'squad-formation',
    label: 'Squad Formation',
    missionLabel: 'Join Your Squad',
    description: 'Select research market preferences for your startup squad.',
    feeds: 'Research Squad',
  },
  {
    id: 'squad-charter',
    label: 'Squad Charter Builder',
    missionLabel: 'Sign Your Charter',
    description: 'Co-create your squad charter and commit with a digital signature.',
    feeds: 'Squad Charter',
  },
];

export const AMBITION_CARDS = [
  { id: 'financial_freedom', label: 'Financial Freedom', emoji: '💰' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', emoji: '🚀' },
  { id: 'leadership', label: 'Leadership', emoji: '🎯' },
  { id: 'helping_others', label: 'Helping Others', emoji: '🤝' },
  { id: 'building_wealth', label: 'Building Wealth', emoji: '📈' },
  { id: 'building_team', label: 'Building a Team', emoji: '👥' },
  { id: 'professional_expertise', label: 'Professional Expertise', emoji: '💼' },
  { id: 'personal_growth', label: 'Personal Growth', emoji: '🌱' },
];

/** @deprecated Use AMBITION_CARDS — kept for legacy reads */
export const MOTIVATION_CARDS = AMBITION_CARDS;

export const AMBITION_EXAMPLES = [
  'Build a successful financial services business',
  'Become a trusted financial advisor',
  'Lead a team of future entrepreneurs',
  'Achieve financial independence',
  'Create impact in my community',
];

export const PURPOSE_PROMPTS = [
  {
    key: 'whyImportant',
    label: 'Why is achieving your ambition important to you?',
    placeholder: 'This matters to me because…',
  },
  {
    key: 'whoImpact',
    label: 'Who do you want to help or impact?',
    placeholder: 'Families, professionals, my community…',
  },
  {
    key: 'successFeels',
    label: 'What would success feel like for you?',
    placeholder: 'I would feel proud when…',
  },
  {
    key: 'difference',
    label: 'What difference do you want to make?',
    placeholder: 'I want to create…',
  },
];

export const VALUE_OPTIONS = [
  { id: 'integrity', label: 'Integrity' },
  { id: 'service', label: 'Service' },
  { id: 'growth', label: 'Growth' },
  { id: 'excellence', label: 'Excellence' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'accountability', label: 'Accountability' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'empathy', label: 'Empathy' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'courage', label: 'Courage' },
  { id: 'humility', label: 'Humility' },
];

export const CAREER_TRACK_AMBITION_EXAMPLES = {
  agency_builder:
    'By 2029, I aim to become a Unit Manager leading a productive team of advisors serving hundreds of families.',
  specialist_consultant:
    'By 2029, I aim to become the preferred financial advisor for professionals in my chosen niche market.',
};

export const RESEARCH_MARKETS = [
  { id: 'gen_z', label: 'Gen Z' },
  { id: 'young_professionals', label: 'Young Professionals' },
  { id: 'families', label: 'Families' },
  { id: 'ofws', label: 'OFWs' },
  { id: 'business_owners', label: 'Business Owners' },
  { id: 'healthcare_professionals', label: 'Healthcare Professionals' },
];

export const DREAM_BOARD_CATEGORIES = [
  { id: 'lifestyle', label: 'Lifestyle', color: 'bg-violet-50 border-violet-200 text-violet-900' },
  { id: 'family', label: 'Family', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { id: 'health', label: 'Health', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'career', label: 'Career', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { id: 'financial', label: 'Financial', color: 'bg-spike-muted border-spike/20 text-spike' },
  { id: 'community', label: 'Community', color: 'bg-teal-50 border-teal-200 text-teal-900' },
  { id: 'travel', label: 'Travel', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'business', label: 'Business', color: 'bg-amber-50 border-amber-200 text-amber-900' },
];

export const VENTURE_PATH_CARDS = [
  {
    id: 'agency_builder',
    label: 'Agency Builder',
    description: 'Build a team and agency.',
  },
  {
    id: 'specialist_consultant',
    label: 'Specialist Consultant',
    description: 'Build expertise and a niche practice.',
  },
  {
    id: 'undecided',
    label: 'Undecided',
    description: 'Still exploring.',
  },
];

export const DAY1_ID = 'day-segment-1-week-1-day-1';

/** Legacy builder IDs mapped to current IDs for stored progress */
export const LEGACY_BUILDER_IDS = {
  'discover-why': 'purpose-builder',
  'design-future': 'future-self',
};

/** Maps Day 1 builder IDs → AI Venture Coach section IDs */
export const DAY1_BUILDER_COACH_MAP = Object.fromEntries(
  DAY1_BUILDERS.filter((b) => b.coachSection).map((b) => [b.id, b.coachSection]),
);

/** @param {string} builderId */
export function getCoachSectionForBuilder(builderId) {
  return DAY1_BUILDER_COACH_MAP[builderId] ?? null;
}

/** @param {string} builderId */
export function isCoachBackedBuilder(builderId) {
  return Boolean(DAY1_BUILDER_COACH_MAP[builderId]);
}

/** @param {string} builderId */
export function getDay1Builder(builderId) {
  return DAY1_BUILDERS.find((b) => b.id === builderId) ?? null;
}
