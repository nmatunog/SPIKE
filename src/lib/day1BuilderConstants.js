/** Venture Blueprint Builders™ — Day 1 constants */

export const DAY1_BUILDERS = [
  {
    id: 'discover-why',
    label: 'Discover Your Why',
    missionLabel: 'Discover Your Why',
    description: 'Choose what motivates you and craft your Personal Why Statement.',
    feeds: 'Vision & Purpose',
  },
  {
    id: 'design-future',
    label: 'Design Your Future',
    missionLabel: 'Design Your Future',
    description: 'Map your timeline and future self narrative.',
    feeds: 'Vision Section',
  },
  {
    id: 'dream-board',
    label: 'Dream Board Studio',
    missionLabel: 'Create Your Dream Board',
    description: 'Visualize lifestyle, family, business, and financial goals.',
    feeds: 'Vision Section',
  },
  {
    id: 'future-venture',
    label: 'Future Venture Snapshot',
    missionLabel: 'Explore Your Venture Path',
    description: 'Share which ACS path interests you today — no commitment yet.',
    feeds: 'Career Track Explorer',
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

export const MOTIVATION_CARDS = [
  { id: 'financial_freedom', label: 'Financial Freedom', emoji: '💰' },
  { id: 'helping_people', label: 'Helping People', emoji: '🤝' },
  { id: 'building_business', label: 'Building a Business', emoji: '🏗️' },
  { id: 'leadership', label: 'Leadership', emoji: '🎯' },
  { id: 'family_security', label: 'Family Security', emoji: '🏠' },
  { id: 'personal_growth', label: 'Personal Growth', emoji: '🌱' },
  { id: 'making_impact', label: 'Making an Impact', emoji: '✨' },
];

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
  { id: 'travel', label: 'Travel', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'business', label: 'Business', color: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'health', label: 'Health', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'community', label: 'Community', color: 'bg-teal-50 border-teal-200 text-teal-900' },
  { id: 'financial_goals', label: 'Financial Goals', color: 'bg-spike-muted border-spike/20 text-spike' },
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

export const FUTURE_TIMELINE = [
  { id: 'today', label: 'Today' },
  { id: 'year_1', label: '1 Year' },
  { id: 'year_3', label: '3 Years' },
  { id: 'year_10', label: '10 Years' },
];

export const DAY1_ID = 'day-segment-1-week-1-day-1';

/** @param {string} builderId */
export function getDay1Builder(builderId) {
  return DAY1_BUILDERS.find((b) => b.id === builderId) ?? null;
}
