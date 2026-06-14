/** Mentor Operating Framework — Week 1 specification constants. */

export const MENTOR_PHILOSOPHY =
  'Mentors do not teach — they coach. Program Coaches deliver content; mentors help participants process, internalize, and apply what they learned.';

export const WEEK1_MENTOR_OUTCOMES = [
  'Ambition',
  'Impact',
  'Values',
  'Future Self Narrative',
  'Career Direction',
  'Squad Membership',
  'Squad Charter',
  'FE Canvas v1',
  'Portfolio v1',
];

export const WEEK1_COACHING_OUTCOMES = [
  'At least one meaningful coaching conversation',
  'At least one mentor assessment',
  'A Week 1 coaching summary',
];

/** @type {Array<{ id: string, label: string, question: string, min: number, max: number }>} */
export const WEEK1_ASSESSMENT_CATEGORIES = [
  {
    id: 'identity_clarity',
    label: 'Identity Clarity',
    question: 'Does the participant demonstrate clear ambition and direction?',
    min: 1,
    max: 5,
  },
  {
    id: 'engagement',
    label: 'Engagement',
    question: 'Actively participates in activities?',
    min: 1,
    max: 5,
  },
  {
    id: 'coachability',
    label: 'Coachability',
    question: 'Open to feedback and reflection?',
    min: 1,
    max: 5,
  },
  {
    id: 'communication',
    label: 'Communication',
    question: 'Communicates ideas effectively?',
    min: 1,
    max: 5,
  },
  {
    id: 'leadership_potential',
    label: 'Leadership Potential',
    question: 'Shows initiative and influence?',
    min: 1,
    max: 5,
  },
];

/** @type {Array<{ id: string, label: string }>} */
export const MENTOR_RECOMMENDATIONS = [
  { id: 'continue_normally', label: 'Continue Normally' },
  { id: 'monitor_closely', label: 'Monitor Closely' },
  { id: 'needs_coaching', label: 'Needs Additional Coaching' },
  { id: 'future_leader', label: 'Potential Future Leader' },
];

/** @type {Array<{ day: number, theme: string, objective: string, expectedOutput: string }>} */
export const WEEK1_DAY_META = [
  { day: 1, theme: 'Identity', objective: 'Connect opportunity to personal ambition.', expectedOutput: 'Participant Snapshot' },
  { day: 2, theme: 'Opportunity', objective: 'Connect industry opportunity to personal goals.', expectedOutput: 'Opportunity Reflection' },
  { day: 3, theme: 'Customer', objective: 'Develop empathy and customer awareness.', expectedOutput: 'Customer Understanding Assessment' },
  { day: 4, theme: 'Entrepreneur', objective: 'Explore venture paths.', expectedOutput: 'Career Track Assessment' },
  { day: 5, theme: 'Commitment', objective: 'Create clarity and commitment.', expectedOutput: 'Week 1 Coaching Summary' },
];

export const COACHING_QUEUE_BUCKETS = [
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'needs_follow_up', label: 'Needs Follow-Up' },
  { id: 'at_risk', label: 'At Risk' },
  { id: 'incomplete_outputs', label: 'Incomplete Outputs' },
];
