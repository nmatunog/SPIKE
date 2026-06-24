/** FEC Validation Lab™ — Week 2 Thursday–Friday */

export const INTERVIEWS_PER_MEMBER = 3;
export const SQUAD_INTERVIEW_TARGET = 9;

/** @typedef {'uvp' | 'who_we_serve' | 'problem_we_solve' | 'client_experience' | 'winning_strategy'} FecBoxId */

/**
 * @typedef {Object} FecValidationStepDef
 * @property {string} id
 * @property {string} slug
 * @property {number} step
 * @property {string} title
 * @property {string} subtitle
 * @property {FecBoxId} fecBox
 * @property {string} fecBoxLabel
 */

/** @type {FecValidationStepDef[]} */
export const FEC_VALIDATION_STEPS = [
  {
    id: 'fec-step-1',
    slug: 'fec-step-1',
    step: 1,
    title: 'Customer Reality Check',
    subtitle: 'Who we serve — aggregate all squad interviews',
    fecBox: 'who_we_serve',
    fecBoxLabel: 'WHO WE SERVE',
  },
  {
    id: 'fec-step-2',
    slug: 'fec-step-2',
    step: 2,
    title: 'Problem Validation',
    subtitle: 'Problem we solve — frequency and evidence',
    fecBox: 'problem_we_solve',
    fecBoxLabel: 'PROBLEM WE SOLVE',
  },
  {
    id: 'fec-step-3',
    slug: 'fec-step-3',
    step: 3,
    title: 'UVP Stress Test',
    subtitle: 'Does evidence support your Week 1 UVP?',
    fecBox: 'uvp',
    fecBoxLabel: 'UNIQUE VENTURE PROPOSITION',
  },
  {
    id: 'fec-step-4',
    slug: 'fec-step-4',
    step: 4,
    title: 'Client Experience Discovery',
    subtitle: 'What advisor experience do customers want?',
    fecBox: 'client_experience',
    fecBoxLabel: 'CLIENT EXPERIENCE',
  },
  {
    id: 'fec-step-5',
    slug: 'fec-step-5',
    step: 5,
    title: 'Strategic Opportunity',
    subtitle: 'Which opportunity deserves squad focus?',
    fecBox: 'winning_strategy',
    fecBoxLabel: 'WINNING STRATEGY',
  },
  {
    id: 'fec-step-6',
    slug: 'fec-step-6',
    step: 6,
    title: 'Build the Pitch',
    subtitle: 'AI draft from interviews → insights → FEC',
    fecBox: 'uvp',
    fecBoxLabel: 'MARKET VALIDATION PITCH',
  },
];

/** @type {Record<FecBoxId, { label: string, before: number, fieldKey: string, engineKey?: string, summaryKey?: string }>} */
export const FEC_BOX_META = {
  uvp: { label: 'UVP', before: 45, fieldKey: 'unified_venture_proposition', summaryKey: 'unified_venture_proposition' },
  who_we_serve: { label: 'Who We Serve', before: 60, fieldKey: 'customer_segments', engineKey: 'create_value' },
  problem_we_solve: { label: 'Problem We Solve', before: 40, fieldKey: 'customer_problem', engineKey: 'create_value' },
  client_experience: { label: 'Client Experience', before: 25, fieldKey: 'value_offering', engineKey: 'create_value' },
  winning_strategy: { label: 'Winning Strategy', before: 15, fieldKey: 'growth_multipliers', engineKey: 'agency_leadership' },
};

/** @type {Array<{ id: string, label: string, responsibility: string }>} */
export const SQUAD_ROLE_DEFS = [
  { id: 'research_lead', label: 'Research Lead', responsibility: 'Evidence review' },
  { id: 'fec_lead', label: 'FEC Lead', responsibility: 'FEC validation' },
  { id: 'pitch_lead', label: 'Pitch Lead', responsibility: 'Friday presentation' },
];

export const PITCH_SLIDE_KEYS = [
  { key: 'mission', label: 'Original Venture' },
  { key: 'whatWeThought', label: 'What We Assumed' },
  { key: 'whoInterviewed', label: 'Who We Interviewed' },
  { key: 'whatWeHeard', label: 'What We Learned' },
  { key: 'customerVoices', label: 'Customer Voices' },
  { key: 'whatChanged', label: 'What Changed' },
  { key: 'fecBefore', label: 'FEC Before' },
  { key: 'fecAfter', label: 'FEC After' },
  { key: 'strategicOpportunity', label: 'Strategic Opportunity' },
  { key: 'nextStep', label: 'What We Will Build Next' },
];

/** Three-studio venture lab flow (replaces 6-step workshop pages). */
export const FEC_STUDIO_PHASES = [
  {
    id: 'fec-studio-1',
    slug: 'fec-studio-1',
    phase: 1,
    title: 'What Did We Learn?',
    subtitle: 'Review evidence — not opinions, not assumptions.',
    studioLabel: 'Studio 1',
  },
  {
    id: 'fec-studio-2',
    slug: 'fec-studio-2',
    phase: 2,
    title: 'What Must Change?',
    subtitle: 'Upgrade the Financial Entrepreneurship Canvas.',
    studioLabel: 'Studio 2',
  },
  {
    id: 'fec-studio-3',
    slug: 'fec-studio-3',
    phase: 3,
    title: 'What Will We Do Next?',
    subtitle: 'Convert insight into action.',
    studioLabel: 'Studio 3',
  },
];

/** Maps FEC box → legacy step id for canvas sync. */
export const FEC_BOX_STEP_MAP = {
  who_we_serve: 'fec-step-1',
  problem_we_solve: 'fec-step-2',
  uvp: 'fec-step-3',
  client_experience: 'fec-step-4',
  winning_strategy: 'fec-step-5',
};
