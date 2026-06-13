/** Faculty Operating Framework — Week 1 specification constants. */

export const FACULTY_PHILOSOPHY =
  'Faculty delivers content — presentations, activities, worksheets, assessments, and rubrics. You teach what participants should know; mentors coach who they become.';

export const WEEK1_FACULTY_THEME = 'Dream • Discover • Decide';

export const WEEK1_FACULTY_OUTCOMES = [
  'Ambition',
  'Impact',
  'Values',
  'Future Self Narrative',
  'Career Direction',
  'Dream Board',
  'Squad Charter',
  'Customer Persona',
  'FE Canvas v1',
  'Venture Portfolio presentation',
];

/** @type {Array<{ day: number, theme: string, objective: string, expectedOutput: string }>} */
export const WEEK1_FACULTY_DAY_META = [
  {
    day: 1,
    theme: 'Discover Yourself',
    objective: 'Deliver AIA, Agency, and SPIKE stories; facilitate identity builders; form squads.',
    expectedOutput: 'Ambition, Impact, Values, Dream Board, Squad Charter',
  },
  {
    day: 2,
    theme: 'Opportunity',
    objective: 'Map financial services landscape; connect industry to ambition; practitioner interviews.',
    expectedOutput: 'Interview Notes, Industry Insights, Opportunity Reflection',
  },
  {
    day: 3,
    theme: 'Customer',
    objective: 'Identify customer problems; build personas; plan needs-analysis surveys.',
    expectedOutput: 'Customer Persona, Market Insights',
  },
  {
    day: 4,
    theme: 'Entrepreneur',
    objective: 'Explore venture paths; draft FE Canvas v1 (30%+); present canvas snapshot.',
    expectedOutput: 'FE Canvas v1, Career Direction checkpoint',
  },
  {
    day: 5,
    theme: 'Commitment',
    objective: 'Present Venture Portfolio; synthesize Week 1; commit to Week 2 priorities.',
    expectedOutput: 'Venture Portfolio presentation, Week 2 commitment',
  },
];
