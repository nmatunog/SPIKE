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

/** @type {Record<FecBoxId, { label: string, before: number, fieldKey: string, summaryKey?: string }>} */
export const FEC_BOX_META = {
  uvp: { label: 'UVP', before: 45, fieldKey: 'unified_venture_proposition', summaryKey: 'unified_venture_proposition' },
  who_we_serve: { label: 'Who We Serve', before: 60, fieldKey: 'customer_segments' },
  problem_we_solve: { label: 'Problem We Solve', before: 40, fieldKey: 'customer_problem' },
  client_experience: { label: 'Client Experience', before: 25, fieldKey: 'value_offering' },
  winning_strategy: { label: 'Winning Strategy', before: 15, fieldKey: 'value_offering' },
};

/** @type {Array<{ id: string, label: string, responsibility: string }>} */
export const SQUAD_ROLE_DEFS = [
  { id: 'research_lead', label: 'Research Lead', responsibility: 'Evidence review' },
  { id: 'fec_lead', label: 'FEC Lead', responsibility: 'FEC validation' },
  { id: 'pitch_lead', label: 'Pitch Lead', responsibility: 'Friday presentation' },
];

export const PITCH_SLIDE_KEYS = [
  { key: 'mission', label: 'Mission' },
  { key: 'whoInterviewed', label: 'Who We Interviewed' },
  { key: 'whatWeThought', label: 'What We Thought' },
  { key: 'whatWeHeard', label: 'What We Heard' },
  { key: 'customerVoices', label: 'Customer Voices' },
  { key: 'validatedProblem', label: 'Validated Problem' },
  { key: 'uvpBefore', label: 'UVP Before' },
  { key: 'uvpAfter', label: 'UVP After' },
  { key: 'strategicOpportunity', label: 'Strategic Opportunity' },
  { key: 'nextStep', label: 'Next Step' },
];
