/** Week 4 Day 2 — Talent Growth Engine mission flow (SPIKE Venture Studio). */

/**
 * @typedef {Object} Week4Day2MissionDef
 * @property {number} id
 * @property {string} slug
 * @property {string} title
 * @property {string} objective
 * @property {string} [prompt]
 */

/** @type {Week4Day2MissionDef[]} */
export const WEEK4_DAY2_MISSIONS = [
  {
    id: 1,
    slug: 'five-x-challenge',
    title: 'Set Your 5× Challenge',
    objective: 'Name what 5× impact looks like if you break today\'s capacity limits.',
    prompt: 'What would 5× look like for your venture — clients, advisors, revenue, or lives changed?',
  },
  {
    id: 2,
    slug: 'stage-redesign',
    title: 'Redesign One Growth Engine Stage',
    objective: 'Pick one canvas stage, name the bottleneck, design your solution, and define expected impact.',
    prompt: 'What\'s the biggest constraint in this stage — and how will your solution break through it?',
  },
  {
    id: 3,
    slug: 'leadership-multiplier',
    title: 'Leadership Multiplier',
    objective: 'Reflect on how leadership scales your engine — and encode your Talent Growth Engine update.',
    prompt: 'If leadership is the multiplier, how many leaders does your engine need?',
  },
];

/** @type {{ id: string, label: string, hint: string }[]} */
export const WEEK4_GROWTH_ENGINE_STAGES = [
  { id: 'attract', label: 'Attract', hint: 'Reach the right people consistently' },
  { id: 'engage', label: 'Engage', hint: 'Spark interest and build connection' },
  { id: 'qualify', label: 'Qualify', hint: 'Identify the right potential with AI' },
  { id: 'license', label: 'License', hint: 'Make licensing faster, easier, and scalable' },
  { id: 'activate', label: 'Activate', hint: 'Launch new advisors with structure and confidence' },
  { id: 'produce', label: 'Produce', hint: 'Drive early wins and build consistency' },
  { id: 'multiply', label: 'Multiply', hint: 'Develop leaders and build strong teams' },
  { id: 'lead', label: 'Lead', hint: 'Build agencies and create lasting legacy' },
];

export const WEEK4_DAY2_ID = 'day-segment-1-week-4-day-2';
export const WEEK4_DAY2_SLIDE_COUNT = 12;
export const WEEK4_DAY2_HERO_IMAGE = '/content/segment-1/week-4/day-2/deck-01/slide-01.png';
export const WEEK4_DAY2_DECK_URL =
  '/api/coach/faculty-deck/segment-1/week-4/day-2/faculty-deck-01.pdf';
