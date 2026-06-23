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
    theme: 'Market Validation Pitch',
    coachStatus: 'Market Validation Pitch',
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
    { id: 'readiness', slug: 'readiness', label: 'Professional Readiness mission', shortLabel: 'Readiness', estMin: 240, day: 3 },
    { id: 'readiness-reflect', slug: 'readiness-reflect', label: 'Professional Readiness reflection', shortLabel: 'Reflect', estMin: 10, day: 3 },
  ],
  4: [
    { id: 'fec-lab', slug: 'fec-lab', label: 'FEC Validation Lab™', shortLabel: 'Lab', estMin: 10, day: 4, optional: true },
    { id: 'fec-step-1', slug: 'fec-step-1', label: 'Customer Reality Check', shortLabel: 'Reality', estMin: 20, day: 4 },
    { id: 'fec-step-2', slug: 'fec-step-2', label: 'Problem Validation', shortLabel: 'Problem', estMin: 20, day: 4 },
    { id: 'fec-step-3', slug: 'fec-step-3', label: 'UVP Stress Test', shortLabel: 'UVP', estMin: 20, day: 4 },
    { id: 'fec-step-4', slug: 'fec-step-4', label: 'Client Experience', shortLabel: 'Experience', estMin: 15, day: 4 },
    { id: 'fec-step-5', slug: 'fec-step-5', label: 'Strategic Opportunity', shortLabel: 'Strategy', estMin: 15, day: 4 },
    { id: 'fec-step-6', slug: 'fec-step-6', label: 'Build the Pitch', shortLabel: 'Pitch', estMin: 25, day: 4 },
  ],
  5: [
    { id: 'market-validation-pitch', slug: 'market-validation-pitch', label: 'Market Validation Pitch', shortLabel: 'Validate', estMin: 30, day: 5 },
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
      'Introduce professional readiness (not “licensing”)',
      'Connect SPIKE entrepreneur journey with AIA professional path',
      'Complete AIA Pre-Contract Training Course (~4 hours)',
    ],
    slides: [
      "You've Learned To Discover.",
      'Good Intentions Are Not Enough.',
      'Every Professional Learns · Practices · Qualifies · Serves',
      'Privilege → Responsibility → Preparation → Professional',
      'Professional Readiness Mission',
    ],
    activities: ['Coach transition AM', 'AIA LMS Pre-Contract course PM'],
    deliverables: ['Professional Readiness badge', 'Portfolio reflection'],
    outcomes: ['Evidence of course completion before Friday'],
  },
  {
    day: 4,
    programDay: 9,
    weekday: 'Thursday',
    status: 'Synthesize',
    objectives: [
      'FEC Validation Lab™ — from interviews to venture clarity',
      'Progressive validation of FEC boxes 1–5',
      'AI-generated pitch draft from evidence',
    ],
    slides: ['FEC Validation Lab™', 'Customer Reality → Strategic Opportunity', 'Build the Pitch'],
    activities: ['FEC Validation Lab (6 steps)', 'Interactive FEC confidence scores', 'Squad role assignments'],
    deliverables: ['Validated FEC boxes 1–5', 'AI pitch structure', 'Portfolio auto-sync'],
    outcomes: ['UVP Version 2', 'Evidence-backed venture model', 'Pitch ready for Friday'],
  },
  {
    day: 5,
    programDay: 10,
    weekday: 'Friday',
    status: 'Market Validation Pitch',
    objectives: [
      'Present evidence — What The Market Taught Us (5 min per squad)',
      'Stage Gate — Ready For Build decision',
      'Squad XP + mentor review (4 dimensions)',
    ],
    slides: ['10-slide presentation mode', 'Stage Gate II ceremony'],
    activities: ['Market Validation Pitch', 'Coach squad evaluation', 'Unlock BUILD stage'],
    deliverables: ['Market Validation Evidence portfolio', 'Stage Gate result'],
    outcomes: ['Squad validated for Week 3 Build', '27 interviews → one venture story'],
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
