/** SPIKE Brand Language & Lexicon v1.0 — structured for staff resource page. */

export const SPIKE_BRAND_LEXICON_META = {
  title: 'SPIKE Brand Language & Lexicon',
  version: '1.0 (Working Draft)',
  status: 'Foundational Brand Document',
  purpose:
    'Establish a consistent language across the SPIKE platform, UI/UX, presentations, mentor guides, documentation, AI Coach, and marketing materials.',
  subtitle: 'Strategic Program for Internship Knowledge & Entrepreneurship (SPIKE)',
};

export const SPIKE_BRAND_PRINCIPLES = [
  'Professional',
  'Aspirational',
  'Entrepreneurial',
  'Human-centered',
];

export const SPIKE_JOURNEY_STEPS = [
  'University',
  'SPIKE Venture Practicum',
  'Intern-Cadet',
  'Associate Advisor',
  'Financial Entrepreneur',
  'Agency Leader',
  'Mentor',
  'Program Coach',
];

export const SPIKE_CORE_MESSAGES = [
  'Build your future.',
  'Think better. Build better.',
  "You'll never build alone.",
  'Every venture begins with one idea.',
  'Better questions. Better ventures.',
  'Everything starts today.',
  'One Portfolio. Many Chapters.',
  "Every week you'll add another chapter.",
  'Today you begin. Your journey starts here.',
  "Don't just complete an internship. Build a venture.",
  "You're not here to complete hours. You're here to create momentum.",
  'Education builds knowledge. SPIKE builds entrepreneurs.',
  'Ideas become ventures.',
];

export const SPIKE_CULTURE_STATEMENTS = [
  'Learning happens through building.',
  'Ideas improve through discussion.',
  'Technology should amplify human thinking.',
  'Entrepreneurs solve problems.',
  'Everyone can build something meaningful.',
  'Progress matters more than perfection.',
  'No builder builds alone.',
  'Real learning creates real value.',
];

export const SPIKE_GUIDING_PRINCIPLES = [
  'Build before you perfect.',
  'Better questions create better ventures.',
  'Technology amplifies human potential.',
  'Every Intern-Cadet is capable of creating value.',
  'Your Venture Portfolio is your most important output.',
  'Every week adds another chapter.',
  'Real learning happens through real execution.',
  'No Intern-Cadet builds alone.',
  'Learning is collaborative.',
  'Your internship is the beginning—not the destination.',
];

export const SPIKE_VISION_QUOTES = [
  'Our Squad is presenting at the Venture Showcase.',
  'My Mentor challenged my Venture Blueprint.',
  'The AI Coach helped me refine my mission.',
  "I just completed today's Build Challenge.",
  'Our Program Coach reviewed our Financial Entrepreneurship Canvas.',
];

export const SPIKE_ROLES = [
  {
    id: 'intern-cadet',
    title: 'Intern-Cadet',
    badge: 'Current working title',
    summary: 'The official participant throughout SPIKE.',
    meaning: ['University Intern', 'Entrepreneur-in-training', 'Future Financial Entrepreneur'],
    usedIn: ['Portal', 'Presentations', 'Program Coach Manual', 'Certificates', 'Portfolio', 'AI Coach'],
    neverUse: null,
  },
  {
    id: 'squad',
    title: 'Squad',
    summary: 'Small peer learning team.',
    purpose: ['accountability', 'collaboration', 'brainstorming', 'venture building', 'peer coaching'],
    neverUse: ['Group', 'Team', 'Class'],
  },
  {
    id: 'mentor',
    title: 'Mentor',
    summary: 'Assigned coach of a Squad.',
    responsibilities: [
      'weekly coaching',
      'accountability',
      'venture feedback',
      'personal development',
      'business discussions',
    ],
    note: 'Mentors coach. They don\u2019t lecture.',
  },
  {
    id: 'program-coach',
    title: 'Program Coach',
    badge: 'Current working title',
    summary: 'Formerly Faculty.',
    responsibilities: [
      'facilitates workshops',
      'delivers content',
      'evaluates outputs',
      'oversees all squads',
      'develops mentors',
      'ensures learning quality',
    ],
  },
  {
    id: 'agency-leader',
    title: 'Agency Leader',
    summary: 'Experienced AIA leaders who share real-world experience.',
    examples: ['Agency Directors', 'Unit Managers', 'MDRTs', 'Executive Advisors'],
  },
  {
    id: 'industry-partner',
    title: 'Industry Partner',
    summary: 'External speakers, business owners, entrepreneurs, and professionals.',
    note: 'Future enhancement: Venture Partner',
  },
];

export const SPIKE_TERM_PAIRS = {
  places: [
    { avoid: 'Classroom', prefer: 'Venture Studio (current) or Innovation Hub (under evaluation)' },
    { avoid: 'Training Room', prefer: 'Learning Space or Venture Studio' },
  ],
  learning: [
    { avoid: 'Lesson', prefer: 'Session or Workshop' },
    { avoid: 'Module', prefer: 'Mission — Mission 1, Mission 2, Mission Complete' },
    { avoid: 'Assignment', prefer: "Build Challenge — Today's Build Challenge, Complete your Build Challenge" },
    { avoid: 'Homework', prefer: 'Reflection or Personal Build' },
  ],
  dailyProgress: [
    { avoid: 'Dashboard', prefer: 'Build Studio (current; Mission Control under evaluation)' },
    { avoid: 'Task List', prefer: "Today's Journey" },
    { avoid: 'Progress', prefer: 'Journey Progress' },
    { avoid: 'Checklist', prefer: 'Milestones' },
  ],
  venture: [
    { avoid: 'Portfolio', prefer: 'Venture Portfolio' },
    { avoid: 'Business Plan', prefer: 'Venture Blueprint' },
    { avoid: 'Vision Board', prefer: 'Dream Board' },
    { avoid: 'Business Model', prefer: 'Financial Entrepreneurship Canvas' },
    { avoid: 'Career Plan', prefer: 'Career Direction' },
    { avoid: 'Presentation', prefer: 'Venture Showcase (Demo Day)' },
    { avoid: 'Graduation', prefer: 'Demo Day or Venture Showcase' },
  ],
  ui: [
    { avoid: 'Homepage', prefer: 'Build Studio' },
    { avoid: 'Dashboard Cards', prefer: 'Journey Cards' },
    { avoid: 'Daily Tasks', prefer: "Today's Journey" },
    { avoid: 'Resume', prefer: 'Continue Building' },
    { avoid: 'Completed', prefer: 'Milestone Achieved' },
    { avoid: 'Submit', prefer: 'Publish or Complete' },
    { avoid: 'AI Button', prefer: 'Ask AI Coach' },
    { avoid: 'Save', prefer: 'Save Progress' },
  ],
  presentation: [
    { avoid: "Today we'll discuss…", prefer: "Today we'll build…" },
    { avoid: 'Please complete the assignment.', prefer: "Let's begin today's Build Challenge." },
    { avoid: 'Class Activity', prefer: 'Venture Challenge' },
    { avoid: 'Presentation', prefer: 'Venture Showcase' },
    { avoid: 'Teacher', prefer: 'Program Coach' },
  ],
};

export const SPIKE_WORDS_AVOID = [
  'Teacher',
  'Faculty',
  'Student',
  'Assignment',
  'Homework',
  'Class',
  'Lecture',
  'Lesson',
  'Training',
  'Seminar',
  'Dashboard',
  'OJT Hours',
  'Complete Requirements',
  'Pass the Course',
];

export const SPIKE_WORDS_PREFER = [
  'Program Coach',
  'Intern-Cadet',
  'Build Challenge',
  'Workshop',
  'Mission',
  'Journey',
  'Build Studio',
  'Venture Portfolio',
  'Venture Blueprint',
  'Dream Board',
  'Financial Entrepreneurship Canvas',
  'Journey Progress',
  'Milestones',
  'Venture Showcase',
];

export const SPIKE_IS_NOT = [
  'OJT Portal',
  'LMS',
  'Training Seminar',
  'Classroom',
  'Bootcamp',
  'Internship Tracker',
];

export const SPIKE_IS = [
  'An AI-enabled Venture Practicum.',
  'A Financial Entrepreneurship Incubator.',
  'A bridge between university learning and real-world entrepreneurship.',
];

export const SPIKE_UNDER_REVIEW = [
  'Intern-Cadet (participant identity)',
  'Program Coach (replacing Faculty)',
  'Build Studio (homepage/dashboard name)',
  'Venture Studio (physical learning environment)',
  'Venture Partner vs. Industry Partner',
  'Long-term progression titles beyond the practicum',
];

export const SPIKE_DESIGN_EVOKES = [
  'Apple Keynotes',
  'Google Workspace',
  'Notion',
  'Canva',
  'Linear',
  'IDEO',
  'Y Combinator',
];

export const SPIKE_DESIGN_AVOID = [
  'PowerPoint',
  'Learning Management Systems',
  'Corporate HR Training',
  'Traditional Classrooms',
];

export const SPIKE_TONE = {
  use: ['Confident', 'Modern', 'Encouraging', 'Human', 'Professional', 'Curious', 'Optimistic', 'Builder-oriented'],
  avoid: ['Arrogant', 'Overly corporate', 'Childish', 'Overly academic'],
};

export const SPIKE_DECK_STYLES = [
  {
    id: 'deck-1',
    title: 'Deck 1 — Inspire',
    style: ['Cinematic', 'Premium', 'Documentary', 'Dark', 'Aspirational'],
    purpose: 'Build trust. Create excitement. Inspire.',
  },
  {
    id: 'deck-2',
    title: 'Deck 2 — Build',
    style: ['Bright', 'Open', 'Collaborative', 'Human-centered', 'Minimalist', 'Venture Studio'],
    purpose: 'Transition participants into creation.',
  },
];

export const SPIKE_AI_DO = ['challenges', 'refines', 'compares', 'suggests', 'coaches', 'expands ideas'];
