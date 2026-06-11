/** Week 1 framework seed — JSON fallback when Supabase tables are empty. */

export const FACULTY_WEEK_THEMES = {
  '1-1': 'Dream • Discover • Decide',
};

export const MENTOR_WEEK_THEMES = {
  '1-1': 'Identity • Confidence • Direction',
};

/** @type {Array<Record<string, unknown>>} */
export const FACULTY_DAY_TEMPLATES_SEED = [
  {
    id: 'faculty-s1-w1-d1',
    segment: 1,
    week: 1,
    day: 1,
    theme: 'Discover Yourself — Stories & Building My Future',
    learning_objectives: [
      'Deliver Faculty Deck 01 — AIA, Agency, and SPIKE stories',
      'Deliver Faculty Deck 02 — Ambition, Impact, Values, Future Self, Career Direction',
      'Facilitate identity builders in Venture Blueprint',
      'Form research squads and sign squad charters',
    ],
    key_concepts: [
      'AIA Story',
      'Agency Story',
      'SPIKE Story',
      'Ambition',
      'Impact',
      'Values',
      'Future Self',
      'Career Direction',
      'Research Squads',
    ],
    speaker_notes:
      'Deck 01 frames the incubator with three stories. Deck 02 launches identity builders — debrief after each activity using activity guide questions.',
    discussion_questions: [
      'How does the AIA story connect to your personal why?',
      'What is the difference between employment and building a venture?',
      'Which identity pillar — ambition, impact, or values — was hardest today?',
    ],
    activities: [
      'Ambition builder',
      'Impact builder',
      'Values builder',
      'Future self builder',
      'Career direction explorer',
      'Dream board studio',
      'Squad formation',
      'Squad charter builder',
    ],
    worksheets: ['Personal why statement'],
    assessments: ['Day 1 participation check', 'Venture identity readiness'],
    rubrics: ['Participation rubric', 'Venture identity rubric'],
    expected_outputs: [
      'Ambition',
      'Impact',
      'Values',
      'Future Self Narrative',
      'Career Direction',
      'Dream Board',
      'Squad Charter',
    ],
    status: 'published',
  },
  {
    id: 'faculty-s1-w1-d2',
    segment: 1,
    week: 1,
    day: 2,
    theme: 'Discover The Industry',
    learning_objectives: [
      'Understand financial services landscape',
      'Explore insurance and protection',
      'Connect industry to personal ambition',
    ],
    key_concepts: [
      'Financial Services',
      'Insurance',
      'Protection',
      'Financial Planning',
      'Career Opportunities',
    ],
    speaker_notes:
      'Use industry immersion to link market reality with participant ambition statements from Day 1.',
    discussion_questions: [
      'What surprised you about the industry today?',
      'Where do you see yourself adding value?',
    ],
    activities: ['Industry immersion session', 'Practitioner interview prep'],
    worksheets: ['Interview notes template', 'Industry insights worksheet'],
    assessments: ['Industry comprehension check'],
    rubrics: ['Interview preparation rubric'],
    expected_outputs: ['Interview Notes', 'Industry Insights', 'Research Plan'],
    status: 'published',
  },
  {
    id: 'faculty-s1-w1-d3',
    segment: 1,
    week: 1,
    day: 3,
    theme: 'Discover The Market',
    learning_objectives: [
      'Identify customer problems',
      'Build personas',
      'Map unmet needs to opportunity',
    ],
    key_concepts: ['Problems', 'Needs', 'Customer Segments', 'Personas', 'Opportunity Identification'],
    speaker_notes:
      'Guide squads from observation to structured market insight — problems before solutions.',
    discussion_questions: [
      'What problems did you hear repeatedly?',
      'Who is most affected and why?',
    ],
    activities: ['Market observation', 'Persona workshop', 'Squad research planning'],
    worksheets: ['Customer persona canvas', 'Market insight log'],
    assessments: ['Persona presentation assessment'],
    rubrics: ['Research quality rubric'],
    expected_outputs: ['Customer Persona', 'Market Insights'],
    status: 'published',
  },
  {
    id: 'faculty-s1-w1-d4',
    segment: 1,
    week: 1,
    day: 4,
    theme: 'Financial Entrepreneurship',
    learning_objectives: [
      'Compare advisor vs entrepreneur paths',
      'Introduce agency builder and specialist tracks',
      'Draft Financial Entrepreneurship Canvas v1',
    ],
    key_concepts: [
      'Advisor vs Entrepreneur',
      'Agency Builder',
      'Specialist Consultant',
      'Financial Entrepreneurship Canvas',
    ],
    speaker_notes:
      'Facilitate pathway exploration without prescribing — participants choose direction with evidence.',
    discussion_questions: [
      'Which pathway energizes you today?',
      'What would you build first on your canvas?',
    ],
    activities: ['Canvas workshop', 'Track exploration clinic'],
    worksheets: ['Financial Entrepreneurship Canvas v1'],
    assessments: ['Canvas completeness check'],
    rubrics: ['Canvas presentation rubric'],
    expected_outputs: ['Canvas v1', 'Career Direction'],
    status: 'published',
  },
  {
    id: 'faculty-s1-w1-d5',
    segment: 1,
    week: 1,
    day: 5,
    theme: 'My Venture Direction',
    learning_objectives: [
      'Articulate 3-year vision',
      'Map opportunities to goals',
      'Commit to venture direction',
    ],
    key_concepts: ['3-Year Vision', 'Opportunity Mapping', 'Goals', 'Commitment'],
    speaker_notes:
      'Close Week 1 with squad presentations and a published Venture Blueprint draft.',
    discussion_questions: [
      'What are you building?',
      'Who do you serve?',
      'What will success look like in 3 years?',
    ],
    activities: ['Venture direction presentations', 'Squad pitch rehearsal'],
    worksheets: ['Venture Blueprint draft checklist'],
    assessments: ['Week 1 venture board readiness'],
    rubrics: ['Presentation rubric', 'Venture direction rubric'],
    expected_outputs: ['Venture Blueprint Draft', 'Squad Presentation'],
    status: 'published',
  },
];

/** @type {Array<Record<string, unknown>>} */
export const MENTOR_DAY_GUIDES_SEED = [
  {
    id: 'mentor-s1-w1-d1',
    segment: 1,
    week: 1,
    day: 1,
    theme: 'Identity',
    coaching_objective:
      'Connect the SPIKE opportunity to personal ambition. Help participants find authentic voice in identity builders.',
    discussion_questions: [
      'Why did you join SPIKE?',
      'What attracted you to this opportunity?',
      'What future are you hoping to create?',
      'What concerns do you have about the entrepreneurship path?',
      'What part of today resonated most — AIA story, agency story, or your own ambition?',
      'Say your ambition in one sentence — I want to hear it in your words.',
    ],
    observation_areas: ['Confidence', 'Self-Awareness', 'Motivation', 'Communication'],
    reflection_prompts: [
      'Write one sentence that captures who you are becoming.',
      'What fear showed up today?',
    ],
    warning_signs: [
      'Copying facilitator language verbatim',
      'Unable to articulate personal ambition',
      'Withdrawal from squad activity',
    ],
    coaching_tips: ['Listen for authentic voice, not perfect words', 'Celebrate specificity over polish'],
    expected_outcomes: ['Participant Snapshot'],
    status: 'published',
  },
  {
    id: 'mentor-s1-w1-d2',
    segment: 1,
    week: 1,
    day: 2,
    theme: 'Opportunity',
    coaching_objective: 'Connect industry opportunity to personal goals.',
    discussion_questions: [
      'What surprised you about the industry?',
      'What assumptions changed today?',
      'Would you personally buy insurance today? Why?',
      'Where do you see opportunity?',
    ],
    observation_areas: ['Curiosity', 'Industry Understanding', 'Business Awareness'],
    reflection_prompts: ['How does today change your 3-year picture?'],
    warning_signs: ['Dismissing industry as irrelevant', 'Overconfidence without evidence'],
    coaching_tips: ['Link industry facts to their Day 1 ambition statement'],
    expected_outcomes: ['Opportunity Reflection'],
    status: 'published',
  },
  {
    id: 'mentor-s1-w1-d3',
    segment: 1,
    week: 1,
    day: 3,
    theme: 'Customer',
    coaching_objective: 'Develop empathy and customer awareness.',
    discussion_questions: [
      'What concerns did people talk about?',
      'What needs appeared repeatedly?',
      'What surprised you?',
      'What opportunities did you discover?',
    ],
    observation_areas: ['Listening Skills', 'Empathy', 'Problem Identification'],
    reflection_prompts: ['Who is one person you want to help and why?'],
    warning_signs: ['Generic personas with no real observation', 'Solution-first thinking before problem clarity'],
    coaching_tips: ['Push for evidence from conversations and observation'],
    expected_outcomes: ['Customer Understanding Assessment'],
    status: 'published',
  },
  {
    id: 'mentor-s1-w1-d4',
    segment: 1,
    week: 1,
    day: 4,
    theme: 'Entrepreneur',
    coaching_objective: 'Explore venture paths.',
    discussion_questions: [
      'What type of business excites you?',
      'Would you rather build a Practice, build a Team, or build an Agency? Why?',
    ],
    observation_areas: ['Ownership', 'Entrepreneurial Thinking', 'Leadership Interest'],
    reflection_prompts: ['Which track feels most like you today — and what would change your mind?'],
    warning_signs: ['Choosing a track to please others', 'Avoiding commitment entirely'],
    coaching_tips: ['Use canvas gaps as coaching prompts, not grades'],
    expected_outcomes: ['Career Track Assessment'],
    status: 'published',
  },
  {
    id: 'mentor-s1-w1-d5',
    segment: 1,
    week: 1,
    day: 5,
    theme: 'Commitment',
    coaching_objective: 'Create clarity and commitment.',
    discussion_questions: [
      'What are you building?',
      'Who do you want to help?',
      'What would success look like in three years?',
      'What is your next step?',
      'What commitment are you making?',
    ],
    observation_areas: ['Clarity', 'Confidence', 'Commitment', 'Direction'],
    reflection_prompts: ['What is one commitment you will keep this week?'],
    warning_signs: ['Vague vision with no measurable outcome', 'Fear of presenting to squad'],
    coaching_tips: ['End with accountability: one action before next session', 'Generate Week 1 coaching summary'],
    expected_outcomes: ['Week 1 Coaching Summary'],
    status: 'published',
  },
];

/** @param {number} segment @param {number} week */
export function listFacultyDaysFromSeed(segment, week) {
  return FACULTY_DAY_TEMPLATES_SEED.filter((row) => row.segment === segment && row.week === week);
}

/** @param {number} segment @param {number} week @param {number} day */
export function getFacultyDayFromSeed(segment, week, day) {
  return FACULTY_DAY_TEMPLATES_SEED.find(
    (row) => row.segment === segment && row.week === week && row.day === day,
  );
}

/** @param {number} segment @param {number} week */
export function listMentorDaysFromSeed(segment, week) {
  return MENTOR_DAY_GUIDES_SEED.filter((row) => row.segment === segment && row.week === week);
}

/** @param {number} segment @param {number} week @param {number} day */
export function getMentorDayFromSeed(segment, week, day) {
  return MENTOR_DAY_GUIDES_SEED.find(
    (row) => row.segment === segment && row.week === week && row.day === day,
  );
}
