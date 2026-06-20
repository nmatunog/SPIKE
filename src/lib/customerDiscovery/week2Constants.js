/** Week 2 Customer Discovery — constants, squad missions, MIS weights. */

export const WEEK2_COHORT_NAME = 'TYCOONS';

export const MAX_INTERVIEW_QUESTIONS = 5;

export const MIN_ENCODED_INTERVIEWS = 3;
export const TARGET_ENCODED_INTERVIEWS = 5;

/** @type {Record<string, { marketSegment: string, mission: string, locations: string[], objectives: string[], interviewTarget: string, goal: string, success: string }>} */
export const SQUAD_MISSIONS = {
  'Squad Cassiopeia': {
    marketSegment: 'Gen Z Professionals',
    mission:
      'Understand the financial realities of young professionals beginning their careers. Explore budgeting, emergency funds, saving, career aspirations, and financial anxieties — never assume they need products.',
    interviewTarget: '5 Gen Z professionals',
    goal: 'Understand how they handle financial uncertainty.',
    success: 'Complete 5 encoded interviews (minimum 3).',
    locations: [
      'Coffee shops',
      'Universities',
      'Corporate offices',
      'Co-working spaces',
      'Young professional networks',
    ],
    objectives: [
      'Understand goals and career milestones',
      'Discover financial challenges and anxieties',
      'Identify current financial behaviors',
      'Explore dreams and protection gaps',
    ],
  },
  'Squad Pegasus': {
    marketSegment: 'Millennial Young Families',
    mission:
      'Discover how young families make financial decisions — home ownership, cash flow, children\'s future, emergency planning, and life priorities.',
    interviewTarget: '5 young families',
    goal: 'Understand how families coordinate money and protection decisions.',
    success: 'Complete 5 encoded interviews (minimum 3).',
    locations: [
      'Residential communities',
      'Parents groups',
      'Church groups',
      'Playgrounds',
      'Family gatherings',
    ],
    objectives: [
      'Map family financial goals',
      'Trace monthly cash flow priorities',
      'Explore emergency planning habits',
      'Identify protection gaps',
    ],
  },
  'Squad Argo Navis': {
    marketSegment: 'OFW Families',
    mission:
      'Understand families dependent on overseas income — remittances, protection, education, separation challenges, and long-term plans.',
    interviewTarget: '5 OFW-connected families',
    goal: 'Understand remittance flows and family financial security.',
    success: 'Complete 5 encoded interviews (minimum 3).',
    locations: [
      'Families of OFWs',
      'OFW spouses',
      'Neighborhood communities',
      'Church organizations',
    ],
    objectives: [
      'Analyze remittance allocation',
      'Evaluate protection margins',
      'Trace education and return-home plans',
      'Identify separation-related risks',
    ],
  },
};

export const DEFAULT_INTERVIEW_QUESTIONS = [
  {
    id: 'q-1',
    text: 'Tell me about yourself — what do you do and how long have you been working?',
    purpose: 'Warm up and context',
    section: 'Warm Up',
  },
  {
    id: 'q-2',
    text: 'What financial goal excites you most right now?',
    purpose: 'Goals',
    section: 'Goals',
  },
  {
    id: 'q-3',
    text: 'What financial challenge keeps you awake at night?',
    purpose: 'Challenges',
    section: 'Challenges',
  },
  {
    id: 'q-4',
    text: 'How are you handling this challenge today?',
    purpose: 'Current solutions',
    section: 'Current Solutions',
  },
  {
    id: 'q-5',
    text: 'If you could change one thing about your financial situation, what would it be?',
    purpose: 'Reflection',
    section: 'Reflection',
  },
];

/** @type {Array<{ id: string, label: string, shortLabel: string, slug: string, estMin: number }>} */
export const WEEK2_MISSION_TASKS = [
  { id: 'mission', label: 'Read your squad mission', shortLabel: 'Mission', slug: 'mission', estMin: 3 },
  { id: 'guide', label: 'Design 5 interview questions', shortLabel: 'Questions', slug: 'guide', estMin: 12 },
  { id: 'thinking', label: 'Capture what changed your thinking', shortLabel: 'Reflect', slug: 'thinking', estMin: 5 },
];

export const PREPARE_RULES = {
  headline: "Don't Pitch. Ask. Listen.",
  subhead: "Your goal is NOT to prove your idea. Your goal is to challenge it.",
  reminders: [
    "Don't sell. Don't recommend. Just learn.",
    'Listen more than you speak.',
    'Assumptions are not evidence.',
    'Curiosity builds trust.',
  ],
  examples: [
    { bad: 'Do you need insurance?', good: 'Tell me about your biggest financial goal.' },
    { bad: 'Would you invest in a 10% plan?', good: 'What financial challenge worries you most?' },
  ],
};

/** @param {string} [squadName] */
export function resolveSquadMission(squadName) {
  const raw = String(squadName ?? '').trim();
  if (SQUAD_MISSIONS[raw]) {
    return { squadKey: raw, ...SQUAD_MISSIONS[raw] };
  }
  for (const key of Object.keys(SQUAD_MISSIONS)) {
    const short = key.replace(/^Squad\s+/i, '');
    if (
      raw.toLowerCase() === short.toLowerCase()
      || raw.toLowerCase().includes(short.toLowerCase())
      || key.toLowerCase().includes(raw.toLowerCase())
    ) {
      return { squadKey: key, ...SQUAD_MISSIONS[key] };
    }
  }
  return { squadKey: 'Squad Cassiopeia', ...SQUAD_MISSIONS['Squad Cassiopeia'] };
}
