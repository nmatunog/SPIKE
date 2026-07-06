/** Week 4 Day 1 — Platform Integration mission flow (SPIKE Venture Studio). */

/** @typedef {'venture' | 'tool'} VenturePropositionKind */

/**
 * @typedef {Object} Week4Day1MissionDef
 * @property {number} id
 * @property {string} slug
 * @property {string} title
 * @property {string} objective
 * @property {string} [prompt]
 */

/** @type {Week4Day1MissionDef[]} */
export const WEEK4_DAY1_MISSIONS = [
  {
    id: 1,
    slug: 'reposition-venture',
    title: 'Reposition Your Venture',
    objective:
      'Review your Venture Proposition. If it describes a tool or technology instead of your venture, move that detail into Blueprint and sharpen the proposition.',
    prompt: 'What business are you really building — not just the tool you might use?',
  },
  {
    id: 2,
    slug: 'strengthen-box-4',
    title: 'Strengthen Box 4 — Client Experience',
    objective: 'Encode the final client journey from first contact through a lifelong relationship.',
    prompt:
      'How will clients experience your Venture Proposition from first contact until a lifelong relationship?',
  },
  {
    id: 3,
    slug: 'strengthen-box-5',
    title: 'Strengthen Box 5 — Winning Strategy',
    objective: 'Articulate why clients will choose your venture over every alternative.',
    prompt: 'Why will clients choose your venture instead of everyone else?',
  },
  {
    id: 4,
    slug: 'strengthen-box-6',
    title: 'Strengthen Box 6 — Growth Engines',
    objective: 'Select the capabilities that power your venture beyond your own effort.',
    prompt: 'What capabilities will power your venture beyond your own effort?',
  },
  {
    id: 5,
    slug: 'founder-review',
    title: 'Founder Review',
    objective: 'Verify Boxes 4–6 align with your Venture Proposition before you finalize today.',
    prompt: 'Review your FEC — only finalized answers belong on the canvas.',
  },
];

export const WEEK4_DAY1_BLUEPRINT_STEP = {
  id: 6,
  slug: 'blueprint-integration',
  title: 'Blueprint Integration',
  objective: 'Add operational detail to your Business Blueprint — Key Activities and Key Resources stay out of the FEC.',
};

export const WEEK4_CLIENT_JOURNEY_STAGES = [
  { id: 'discover', label: 'Discover' },
  { id: 'plan', label: 'Plan' },
  { id: 'protect', label: 'Protect' },
  { id: 'review', label: 'Review' },
  { id: 'refer', label: 'Refer' },
];

export const WEEK4_WINNING_STRATEGY_EXAMPLES = [
  'Positioning',
  'Differentiation',
  'Community',
  'AI',
  'High Tech + High Touch',
  'Financial Literacy',
  'Personalization',
];

export const WEEK4_GROWTH_ENGINE_GROUPS = {
  advisorExcellence: {
    label: 'Advisor Excellence',
    items: [
      'Client Acquisition & Prospecting',
      'Financial Planning & Advisory',
      'Client Experience',
      'Referrals & Retention',
    ],
  },
  teamLeadership: {
    label: 'Team & Leadership',
    items: [
      'Advisor Recruitment & Selection',
      'Coaching & Mentoring',
      'AIA & Agency Leadership Development',
      'Team Culture',
    ],
  },
  systemsScale: {
    label: 'Systems & Scale',
    items: [
      'AIA Digital Tools',
      'CRM',
      'AI Companion',
      'Community Platform',
      'Marketing Automation',
      'Standard Operating Systems',
    ],
  },
};

export const WEEK4_KEY_ACTIVITY_EXAMPLES = [
  'Prospecting',
  'Discovery Sessions',
  'Financial Planning',
  'Client Reviews',
  'Community Building',
  'Financial Education',
  'Referral Management',
  'Recruitment',
  'Coaching',
];

export const WEEK4_KEY_RESOURCE_EXAMPLES = [
  'People',
  'Products',
  'Technology',
  'AIA Platform',
  'CRM',
  'Digital Tools',
  'AI Companion',
  'Community Platform',
  'Training',
  'Partnerships',
];

export const WEEK4_FOUNDER_REVIEW_QUESTIONS = [
  'Does our Client Experience deliver our Venture Proposition?',
  'Why will clients choose us?',
  'Can our Growth Engines consistently deliver and scale our Venture Proposition?',
];

export const WEEK4_BLUEPRINT_SECTION_SLUG = 'venture-execution';
