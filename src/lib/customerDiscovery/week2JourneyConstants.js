/**
 * Revised Week 2 — mission journey (Mon Prepare → Fri Validate).
 * Program days 6–10 map to playbook week-2 day-1..5.
 */

/** @typedef {'prepare' | 'discover' | 'learn' | 'synthesize' | 'validate'} Week2PhaseId */

/**
 * @typedef {Object} Week2JourneyPhase
 * @property {Week2PhaseId} id
 * @property {number} day Playbook day slug (1–5)
 * @property {number} programDay Cumulative program day (6–10)
 * @property {string} label
 * @property {string} shortLabel
 * @property {string} theme
 * @property {string} coachStatus
 */

/** @type {Week2JourneyPhase[]} */
export const WEEK2_JOURNEY_PHASES = [
  {
    id: 'prepare',
    day: 1,
    programDay: 6,
    label: 'Prepare',
    shortLabel: 'Prepare',
    theme: 'Customer Discovery Mission',
    coachStatus: 'Prepare',
  },
  {
    id: 'discover',
    day: 2,
    programDay: 7,
    label: 'Discover',
    shortLabel: 'Discover',
    theme: 'Field Research & Market Exchange',
    coachStatus: 'Discover',
  },
  {
    id: 'learn',
    day: 3,
    programDay: 8,
    label: 'Learn',
    shortLabel: 'Learn',
    theme: 'Professional Readiness',
    coachStatus: 'Professional Readiness',
  },
  {
    id: 'synthesize',
    day: 4,
    programDay: 9,
    label: 'Synthesize',
    shortLabel: 'Synthesize',
    theme: 'FEC Validation Lab™',
    coachStatus: 'Synthesize',
  },
  {
    id: 'validate',
    day: 5,
    programDay: 10,
    label: 'Validate',
    shortLabel: 'Validate',
    theme: 'Pitch · Empathy · Advise',
    coachStatus: 'Pitch · Empathy · Advise',
  },
];

/**
 * @typedef {Object} Week2MissionTask
 * @property {string} id
 * @property {string} slug
 * @property {string} label
 * @property {string} shortLabel
 * @property {number} estMin
 * @property {number} day
 * @property {boolean} [optional]
 */

/** @type {Record<number, Week2MissionTask[]>} */
export const WEEK2_DAY_TASKS = {
  1: [
    { id: 'mission', slug: 'mission', label: 'Prepare for Customer Discovery', shortLabel: 'Mission', estMin: 5, day: 1 },
    { id: 'assumptions', slug: 'assumptions', label: 'Identify assumptions', shortLabel: 'Assumptions', estMin: 10, day: 1 },
    { id: 'guide', slug: 'guide', label: 'Create 5 interview questions', shortLabel: 'Questions', estMin: 12, day: 1 },
    { id: 'research-plan', slug: 'research-plan', label: 'Submit field research plan', shortLabel: 'Plan', estMin: 8, day: 1 },
    { id: 'squad-align', slug: 'squad-align', label: 'Squad alignment', shortLabel: 'Squad', estMin: 5, day: 1 },
  ],
  2: [
    { id: 'interview-1', slug: 'interview-1', label: 'Interview 1', shortLabel: 'Int. 1', estMin: 15, day: 2 },
    { id: 'interview-2', slug: 'interview-2', label: 'Interview 2', shortLabel: 'Int. 2', estMin: 15, day: 2 },
    { id: 'interview-3', slug: 'interview-3', label: 'Interview 3', shortLabel: 'Int. 3', estMin: 15, day: 2 },
    { id: 'exchange', slug: 'exchange', label: 'Midweek intelligence reflection', shortLabel: 'Exchange', estMin: 10, day: 2 },
  ],
  3: [
    {
      id: 'readiness-mission',
      slug: 'readiness-mission',
      label: 'Professional Readiness Mission',
      shortLabel: 'Mission',
      estMin: 270,
      day: 3,
    },
  ],
  4: [
    { id: 'fec-studio', slug: 'fec-studio', label: 'FEC Validation Lab™', shortLabel: 'Lab', estMin: 10, day: 4, optional: true },
    { id: 'fec-studio-1', slug: 'fec-studio-1', label: 'What Did We Learn?', shortLabel: 'Learn', estMin: 25, day: 4 },
    { id: 'fec-studio-2', slug: 'fec-studio-2', label: 'What Must Change?', shortLabel: 'Evolve', estMin: 40, day: 4 },
    { id: 'fec-studio-3', slug: 'fec-studio-3', label: 'What Will We Do Next?', shortLabel: 'Act', estMin: 25, day: 4 },
  ],
  5: [
    { id: 'market-validation-pitch', slug: 'market-validation-pitch', label: 'Market Validation Pitch', shortLabel: 'Pitch', estMin: 30, day: 5 },
    { id: 'empathy-lab', slug: 'empathy-lab', label: 'Empathy Lab — Think Like Miguel', shortLabel: 'Empathy', estMin: 45, day: 5 },
    { id: 'week-wrap-up', slug: 'week-wrap-up', label: 'Week wrap-up & Week 3 bridge', shortLabel: 'Reflect', estMin: 12, day: 5 },
  ],
};

/** Coach timeline cards — replaces lesson-plan-first coach view for Week 2. */
export const WEEK2_COACH_TIMELINE = [
  {
    day: 1,
    programDay: 6,
    weekday: 'Monday',
    status: 'Prepare',
    objectives: [
      'Validate mindset — assumptions are not evidence',
      'Identify squad assumptions and interview guide',
      'Submit field research plan and align squad',
    ],
    slides: ['Deck 01 — Validate Mindset', 'Deck 02 — Research Studio Workshop'],
    activities: ['Assumption mapping', 'Interview guide design', 'Squad planning', 'Practice interviews'],
    deliverables: ['Customer Discovery Preparation (portfolio auto-create)'],
    outcomes: ['Squad mission acknowledged', '5 interview questions', 'Field research plan submitted'],
  },
  {
    day: 2,
    programDay: 7,
    weekday: 'Tuesday',
    status: 'Discover',
    objectives: [
      'Conduct field interviews (minimum 3, target 5)',
      'Encode interviews in SPIKE Studio Discover mode',
      'Market Intelligence Exchange — squad shares patterns',
    ],
    slides: [
      'What Did The Market Tell You?',
      'Market Intelligence Exchange',
      'One Interview Is A Story. Thirty Are Evidence.',
      'Go Back. Verify The Pattern.',
    ],
    activities: ['Field research AM', 'Squad exchange PM (7 min per squad)'],
    deliverables: ['Encoded interviews', 'Midweek Intelligence Reflection'],
    outcomes: ['Participants return to field with clearer hypotheses'],
  },
  {
    day: 3,
    programDay: 8,
    weekday: 'Wednesday',
    status: 'Professional Readiness',
    objectives: [
      'Bridge customer discovery → professional readiness → FEC validation',
      'Complete AIA PCTC and professional readiness reflection',
      'UVP checkpoint from interview evidence — prepare for Thursday',
    ],
    slides: [
      "You've Learned To Discover.",
      'Good Intentions Are Not Enough.',
      'Professional Readiness Mission',
      'Interview Intelligence Board',
      'UVP Checkpoint → Thursday Readiness',
    ],
    activities: ['PCTC completion', 'Reflection + voice notes', 'UVP checkpoint', 'Squad role assignments'],
    deliverables: ['PCTC badge', 'Reflection summary', 'UVP checkpoint decision', 'Thursday readiness score'],
    outcomes: ['Mission bridge complete', 'Evidence-linked UVP checkpoint', 'FEC Validation Lab unlocked'],
  },
  {
    day: 4,
    programDay: 9,
    weekday: 'Thursday',
    status: 'Synthesize',
    objectives: [
      'FEC Validation Lab™ — from evidence to venture clarity',
      'Three studios: Learn → Evolve → Act',
      'Venture Evolution View — Week 1 vs Week 2 FEC',
    ],
    slides: ['FEC Validation Lab™', 'Venture Evolution View', 'Build Readiness → Friday Pitch'],
    activities: ['Studio 1 evidence board', 'Studio 2 FEC evolution', 'Studio 3 build readiness + pitch draft'],
    deliverables: ['Evidence board', 'FEC Version 2', 'Venture Evolution Report', 'Pitch draft'],
    outcomes: ['Canvas Clarity Score improved', 'Build readiness confirmed', 'Friday pitch ready'],
  },
  {
    day: 5,
    programDay: 10,
    weekday: 'Friday',
    status: 'Pitch · Empathy · Advise',
    objectives: [
      'Open: From Venture Builder → Financial Entrepreneur (Discover ✓ Validate ✓ → Advise)',
      'Market Validation Pitch — 5 min per squad, evidence not ideas',
      'Empathy Lab with Miguel — understand before you advise',
      'Stage Gate II + Week 3 Discover Your Business Model preview',
    ],
    slides: [
      'From Venture Builder To Financial Entrepreneur',
      'Meet Miguel — Client Profile',
      'Empathy In Action + Think Like Miguel',
      'Reflect & Share — Week 3 Financial Entrepreneurship',
    ],
    activities: [
      'Market Validation Pitch (SPIKE Studio)',
      'Empathy Lab worksheet + squad discussion',
      'Advisor reflection + week wrap-up',
      'Stage Gate II ceremony',
    ],
    deliverables: [
      'Market Validation Pitch submitted',
      'Empathy Lab portfolio capture',
      'Week wrap-up + Week 3 focus',
      'Stage Gate result',
    ],
    outcomes: [
      'Squads present validated evidence',
      'Interns practice empathy → advisor mindset',
      'Ready for Week 3 — Discover Your Business Model',
    ],
  },
];

/** @param {number} day */
export function getWeek2PhaseForDay(day) {
  const d = Math.max(1, Math.min(5, day));
  return WEEK2_JOURNEY_PHASES.find((p) => p.day === d) ?? WEEK2_JOURNEY_PHASES[0];
}

/** @param {number} day */
export function getWeek2TasksForDay(day) {
  const d = Math.max(1, Math.min(5, day));
  return WEEK2_DAY_TASKS[d] ?? [];
}

/** Flat list of all tasks in journey order. */
export function allWeek2MissionTasks() {
  return WEEK2_JOURNEY_PHASES.flatMap((phase) => getWeek2TasksForDay(phase.day));
}
