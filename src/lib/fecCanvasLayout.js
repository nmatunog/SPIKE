/**
 * SPIKE Financial Entrepreneurship Canvas — visual layout (10-box model).
 * Text and structure match the Day 4 FEC poster.
 */

export const FEC_LAYOUT_TITLE = 'FINANCIAL ENTREPRENEURSHIP CANVAS';
export const FEC_LAYOUT_SUBTITLE = 'DESIGN THE FINANCIAL ENGINE OF YOUR VENTURE.';
export const FEC_LAYOUT_FOOTER =
  'ONE VENTURE. CLEAR DESIGN. POWERFUL IMPACT. | Design it well. Build it right. Make it matter.';

/** @typedef {'Gem' | 'Users' | 'Target' | 'Heart' | 'Crown' | 'TrendingUp' | 'Handshake' | 'CircleDollarSign' | 'Route' | 'LayoutDashboard' | 'User' | 'Rocket' | 'BarChart3' | 'Trophy' | 'DollarSign' | 'Shield' | 'UserPlus' | 'UserCircle' | 'Sparkles' | 'Puzzle'} FecLayoutIcon */

export const FEC_PROCESS_STEPS = [
  { icon: 'Target', label: 'CLARIFY your direction' },
  { icon: 'Puzzle', label: 'DESIGN your model' },
  { icon: 'TrendingUp', label: 'CREATE lasting value' },
];

export const FEC_LAYOUT_CENTER = {
  icon: 'Sparkles',
  title: 'UNIQUE VENTURE PROPOSITION',
  tagline: 'The heart of your venture. Everything flows from and supports this.',
};

/** @type {Array<{ id: string, number: number, title: string, icon: FecLayoutIcon, prompt: string, labels: string[], output?: string, grid: 'top' | 'left' | 'right' | 'bottom' | 'wide' | 'center-detail' }>} */
export const FEC_LAYOUT_SIMPLE_BOXES = [
  {
    id: 'uvp_detail',
    number: 1,
    title: 'UNIQUE VENTURE PROPOSITION',
    icon: 'Gem',
    prompt: 'What unique value do you deliver and to whom?',
    labels: ['Your promise to clients', 'What makes you different', 'Why it matters'],
    output: 'Clear statement of your unique value and difference.',
    grid: 'center-detail',
  },
  {
    id: 'who_we_serve',
    number: 2,
    title: 'WHO WE SERVE',
    icon: 'Users',
    prompt: 'Who are your ideal clients?',
    labels: ['Primary segments', 'Key needs', 'Wants & goals', 'Willingness to pay'],
    output: 'Clear profile of your ideal client segments.',
    grid: 'top',
  },
  {
    id: 'problem_we_solve',
    number: 3,
    title: 'PROBLEM WE SOLVE',
    icon: 'Target',
    prompt: 'What problems do you solve for your clients?',
    labels: ['Core problems', 'Root causes', 'Current alternatives', 'Consequences of not solving'],
    grid: 'top',
  },
  {
    id: 'client_experience',
    number: 4,
    title: 'CLIENT EXPERIENCE',
    icon: 'Heart',
    prompt: 'How will you create an amazing experience?',
    labels: ['Before engagement', 'During engagement', 'After engagement', 'Service standards'],
    output: 'Signature experience that drives trust and loyalty.',
    grid: 'right',
  },
  {
    id: 'winning_strategy',
    number: 5,
    title: 'WINNING STRATEGY',
    icon: 'Crown',
    prompt: 'How will you attract, engage, and retain clients?',
    labels: [
      'Positioning & differentiation',
      'Go-to-market approach',
      'Sales & relationship strategy',
      'Retention & referral strategy',
    ],
    output: 'Strategy to acquire, deliver, and retain clients profitably.',
    grid: 'right',
  },
  {
    id: 'key_partners',
    number: 7,
    title: 'KEY PARTNERS',
    icon: 'Handshake',
    prompt: 'Who are the key partners that will help you win?',
    labels: ['Strategic partners', 'Centers of influence', 'Alliances & networks', 'Ecosystem enablers'],
    grid: 'left',
  },
];

export const FEC_GROWTH_ENGINES_BOX = {
  id: 'growth_engines',
  number: 6,
  title: 'GROWTH ENGINES',
  icon: 'TrendingUp',
  prompt: 'Which engines will drive sustainable growth?',
  output: 'Your primary growth engines and how you will activate them.',
  columns: [
    {
      title: 'ADVISOR EXCELLENCE',
      icon: 'User',
      labels: ['Client acquisition', 'Financial planning', 'Client experience', 'Referrals & retention'],
    },
    {
      title: 'TEAM & LEADERSHIP',
      icon: 'Users',
      labels: ['Recruitment', 'Coaching & mentoring', 'Leadership development', 'Team culture'],
    },
    {
      title: 'SYSTEMS & SCALE',
      icon: 'Rocket',
      labels: ['Processes & systems', 'Technology leverage', 'Training & enablement', 'Operational excellence'],
    },
  ],
};

export const FEC_FINANCIAL_ENGINE_BOX = {
  id: 'financial_engine',
  number: 8,
  title: 'FINANCIAL ENGINE',
  prompt: 'How will your venture create, deliver, and capture economic value?',
  output: 'Profitable, sustainable, and scalable financial model.',
  columns: [
    {
      title: 'REVENUE MODEL',
      labels: ['Revenue streams', 'Pricing model', 'Average deal size', 'Revenue targets'],
    },
    {
      title: 'ECONOMICS',
      labels: ['Cost structure', 'Variable vs fixed', 'Contribution margin', 'Operating leverage'],
    },
    {
      title: 'SUSTAINABILITY',
      labels: ['Profitability targets', 'Cash flow plan', 'Break-even point', 'Use of profits'],
    },
  ],
};

export const FEC_ROADMAP_BOX = {
  id: 'venture_roadmap',
  number: 9,
  title: 'VENTURE GROWTH ROADMAP',
  subtitle: 'Your journey. Your milestones.',
  footer: 'YOUR PLAN: When will you achieve these milestones? Target Year/Month for each milestone: ______',
  stages: [
    {
      title: 'YEAR 1: ADVISOR EXCELLENCE',
      icon: 'User',
      labels: ['Build client base', 'Master the fundamentals', 'Consistent production', 'First recruit'],
    },
    {
      title: 'YEAR 2: UNIT LEADER',
      icon: 'Users',
      labels: ['Grow your team', 'Develop leaders', 'Systemize success', 'Leader appointment'],
    },
    {
      title: 'YEARS 3–4: SENIOR UNIT MANAGER',
      icon: 'BarChart3',
      labels: ['Scale operations', 'Strong team culture', 'Higher productivity', 'Business expansion'],
    },
    {
      title: 'YEAR 5+: AGENCY DIRECTOR',
      icon: 'Trophy',
      labels: ['Build enterprise value', 'Multiple leaders', 'Sustainable scale', 'Legacy & impact'],
    },
  ],
};

export const FEC_DASHBOARD_BOX = {
  id: 'measurement_dashboard',
  number: 10,
  title: 'MEASUREMENT DASHBOARD',
  subtitle: 'What gets measured gets managed.',
  footer: 'YOUR TARGETS: Define your key targets for the next 12 months.',
  columns: [
    {
      title: 'CLIENTS',
      icon: 'Users',
      labels: ['New clients', 'Active clients', 'Retention rate', 'NPS / Satisfaction'],
    },
    {
      title: 'REVENUE',
      icon: 'DollarSign',
      labels: ['Total revenue', 'Monthly revenue', 'Revenue growth', 'MDRT progress'],
    },
    {
      title: 'PROTECTION',
      icon: 'Shield',
      labels: ['Policies written', 'Premium volume', 'Persistency rate', 'Claims support'],
    },
    {
      title: 'RECRUITMENT',
      icon: 'UserPlus',
      labels: ['New recruits', 'Active advisors', 'Productivity', 'Conversion rate'],
    },
    {
      title: 'LEADERSHIP',
      icon: 'UserCircle',
      labels: ['Leaders developed', 'Promotion rate', 'Team engagement', 'Culture score'],
    },
    {
      title: 'IMPACT',
      icon: 'Sparkles',
      labels: ['Lives protected', 'Families helped', 'Financial impact', 'Community impact'],
    },
  ],
};

/** Lookup simple box by id. */
export function getFecLayoutBox(id) {
  return FEC_LAYOUT_SIMPLE_BOXES.find((box) => box.id === id);
}
