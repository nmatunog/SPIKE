/** Venture Blueprint section field schemas and completion weights (Sprint 05). */

export const BLUEPRINT_SECTION_WEIGHTS = {
  'vision-purpose': 15,
  canvas: 20,
  'market-intelligence': 15,
  'client-growth': 15,
  'recruitment-growth': 15,
  'leadership-growth': 10,
  'career-accelerator': 10,
};

export const VISION_FIELDS = [
  { key: 'vision_statement', label: 'My Ambition', minChars: 20 },
  { key: 'mission_statement', label: 'My Purpose', minChars: 20 },
  { key: 'my_values', label: 'My Values', minChars: 20 },
  { key: 'future_self_narrative', label: 'Future Self Narrative', minChars: 100 },
  { key: 'dream_board', label: 'Dream Board', minChars: 30 },
  { key: 'cohort_identity', label: 'Cohort Identity', minChars: 10 },
  { key: 'squad_preferences', label: 'Squad Membership', minChars: 10 },
  { key: 'squad_charter', label: 'Squad Charter', minChars: 20 },
  { key: 'lessons_learned', label: 'Lessons Learned', minChars: 20 },
  { key: 'personal_insights', label: 'Personal Insights', minChars: 20 },
  { key: 'growth_reflections', label: 'Growth Reflections', minChars: 20 },
];

export const MARKET_INTELLIGENCE_FIELDS = [
  { key: 'survey_count', label: 'Surveys Completed', computed: true },
  { key: 'research_findings', label: 'Research Findings', minChars: 30 },
  { key: 'market_segment_insights', label: 'Market Segment Insights', minChars: 30 },
  { key: 'opportunity_notes', label: 'Opportunity Notes', minChars: 20 },
];

export const CLIENT_GROWTH_FIELDS = [
  { key: 'completed_fnas', label: 'Completed FNAs', computed: true },
  { key: 'client_profiles_summary', label: 'Client Profiles', minChars: 20 },
  { key: 'protection_gaps_summary', label: 'Protection Gaps', minChars: 20 },
  { key: 'common_needs', label: 'Common Needs', minChars: 20 },
  { key: 'recommendation_categories', label: 'Recommendation Categories', minChars: 20 },
];

export const RECRUITMENT_FIELDS = [
  { key: 'talent_segments', label: 'Talent Segments', minChars: 20 },
  { key: 'recruit_value_proposition', label: 'Recruit Value Proposition', minChars: 20 },
  { key: 'recruitment_channels', label: 'Recruitment Channels', minChars: 20 },
  { key: 'talent_development_system', label: 'Talent Development System', minChars: 20 },
];

export const LEADERSHIP_FIELDS = [
  { key: 'culture_statement', label: 'Culture Statement', minChars: 20 },
  { key: 'leadership_system', label: 'Leadership System', minChars: 20 },
  { key: 'expansion_strategy', label: 'Expansion Strategy', minChars: 20 },
  { key: 'growth_multipliers', label: 'Growth Multipliers', minChars: 20 },
];

export const CAREER_FIELDS = [
  { key: 'current_position', label: 'Current Position', minChars: 5 },
  { key: 'next_milestone', label: 'Next Milestone', minChars: 10 },
  { key: 'promotion_readiness', label: 'Promotion Readiness Notes', minChars: 20 },
];

export const CANVAS_ENGINES = {
  client_growth: {
    label: 'Client Growth Engine',
    fields: [
      { key: 'customer_segments', label: 'Customer Segments' },
      { key: 'value_proposition', label: 'Value Proposition' },
      { key: 'channels', label: 'Channels' },
      { key: 'client_relationships', label: 'Client Relationships' },
      { key: 'revenue_streams', label: 'Revenue Streams' },
    ],
  },
  talent_growth: {
    label: 'Talent Growth Engine',
    fields: [
      { key: 'talent_segments', label: 'Talent Segments' },
      { key: 'recruit_value_proposition', label: 'Recruit Value Proposition' },
      { key: 'recruitment_channels', label: 'Recruitment Channels' },
      { key: 'talent_development_system', label: 'Talent Development System' },
    ],
  },
  leadership_growth: {
    label: 'Leadership Growth Engine',
    fields: [
      { key: 'culture_statement', label: 'Culture Statement' },
      { key: 'leadership_system', label: 'Leadership System' },
      { key: 'expansion_strategy', label: 'Expansion Strategy' },
      { key: 'growth_multipliers', label: 'Growth Multipliers' },
    ],
  },
  foundation: {
    label: 'Foundation',
    fields: [
      { key: 'resources', label: 'Key Resources' },
      { key: 'partners', label: 'Key Partners' },
      { key: 'cost_structure', label: 'Cost Structure' },
    ],
  },
};

/** @param {string} sectionSlug */
export function fieldsForSection(sectionSlug) {
  switch (sectionSlug) {
    case 'vision-purpose':
      return VISION_FIELDS;
    case 'market-intelligence':
      return MARKET_INTELLIGENCE_FIELDS;
    case 'client-growth':
      return CLIENT_GROWTH_FIELDS;
    case 'recruitment-growth':
      return RECRUITMENT_FIELDS;
    case 'leadership-growth':
      return LEADERSHIP_FIELDS;
    case 'career-accelerator':
      return CAREER_FIELDS;
    default:
      return [];
  }
}
