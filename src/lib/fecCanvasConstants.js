/**
 * SPIKE Financial Entrepreneurship Canvas (FEC) — v2 schema constants.
 * Phase 1: data layer only; v1 CANVAS_ENGINES remain for legacy UI until Phase 2.
 */

export const FEC_CANVAS_TITLE = 'SPIKE Financial Entrepreneurship Canvas';
export const FEC_SHORT_LABEL = 'FEC';

export const FEC_SCHEMA_VERSIONS = /** @type {const} */ (['v1', 'v2']);

/** @typedef {'v1' | 'v2'} FecSchemaVersion */

export const FEC_TOP_BANNER =
  "Every decision on this canvas must strengthen ONE Unified Venture Proposition. If a box doesn't support it, rethink the box.";

export const FEC_UVP_HELPER =
  'For (customer), we create (financial outcome) by delivering (solution) profitably and sustainably.';

export const FEC_UVP_SUGGESTIVE_EXAMPLE =
  'We help young Filipino professionals achieve financial independence through affordable protection and disciplined investing while building a scalable advisory business.';

/** Center + summary fields stored in canvas_summary (not canvas_entries). */
export const FEC_SUMMARY_FIELD_KEYS = [
  'unified_venture_proposition',
  'uvp_is_auto',
  'roadmap_12mo',
  'roadmap_24mo',
  'roadmap_36mo',
  'success_narrative',
  'success_revenue',
  'success_customers',
  'success_families_protected',
  'success_jobs',
  'success_annual_profit',
  'scorecard_manual_overrides',
];

export const FEC_V2_PILLARS = {
  create_value: {
    label: 'CREATE VALUE',
    pillarNumber: 1,
    fields: [
      { key: 'customer_segments', label: 'Customer Segments', minChars: 10 },
      { key: 'customer_problem', label: 'Customer Problem', minChars: 10 },
      { key: 'value_offering', label: 'Value Offering', minChars: 10 },
    ],
  },
  capture_value: {
    label: 'CAPTURE VALUE',
    pillarNumber: 2,
    fields: [
      { key: 'revenue_streams', label: 'Revenue Streams', minChars: 10 },
      { key: 'cost_structure', label: 'Cost Structure', minChars: 10 },
      { key: 'profit_formula', label: 'Profit Formula', minChars: 10 },
    ],
  },
  enable_value: {
    label: 'ENABLE VALUE',
    pillarNumber: 3,
    fields: [
      { key: 'key_resources', label: 'Key Resources', minChars: 10 },
      { key: 'key_partners', label: 'Key Partners', minChars: 10 },
      { key: 'funding_strategy', label: 'Funding Strategy', minChars: 10 },
    ],
  },
  prove_value: {
    label: 'PROVE VALUE',
    pillarNumber: 4,
    fields: [],
  },
};

export const FEC_VENTURE_SCORECARD = {
  label: 'Venture Scorecard',
  categories: {
    financial: {
      label: 'Financial',
      fields: [
        { key: 'revenue', label: 'Revenue' },
        { key: 'profit', label: 'Profit' },
        { key: 'cac', label: 'CAC' },
        { key: 'ltv', label: 'LTV' },
      ],
    },
    growth: {
      label: 'Growth',
      fields: [
        { key: 'clients', label: 'Clients' },
        { key: 'referrals', label: 'Referrals' },
        { key: 'conversion', label: 'Conversion' },
      ],
    },
    impact: {
      label: 'Impact',
      fields: [
        { key: 'families_protected', label: 'Families protected' },
        { key: 'premium_placed', label: 'Premium placed' },
        { key: 'lives_improved', label: 'Lives improved' },
      ],
    },
  },
};

/** Scorecard metrics use engine_key prove_value in canvas_entries. */
export const FEC_SCORECARD_FIELD_KEYS = Object.values(FEC_VENTURE_SCORECARD.categories).flatMap(
  (cat) => cat.fields.map((f) => f.key),
);

export const FEC_AGENCY_BUILDER_EXTENSIONS = {
  agency_talent: {
    label: 'Talent & recruitment',
    fields: [
      { key: 'talent_segments', label: 'Talent Segments', minChars: 10 },
      { key: 'recruit_value_proposition', label: 'Recruit Value Proposition', minChars: 10 },
      { key: 'recruitment_channels', label: 'Recruitment Channels', minChars: 10 },
      { key: 'talent_development_system', label: 'Talent Development System', minChars: 10 },
    ],
  },
  agency_leadership: {
    label: 'Leadership & scale',
    fields: [
      { key: 'culture_statement', label: 'Culture Statement', minChars: 10 },
      { key: 'leadership_system', label: 'Leadership System', minChars: 10 },
      { key: 'expansion_strategy', label: 'Expansion Strategy', minChars: 10 },
      { key: 'growth_multipliers', label: 'Growth Multipliers', minChars: 10 },
    ],
  },
};

/** All v2 canvas_entries engine_key values (Supabase check constraint). */
export const FEC_V2_ENGINE_KEYS = [
  ...Object.keys(FEC_V2_PILLARS),
  ...Object.keys(FEC_AGENCY_BUILDER_EXTENSIONS),
  'prove_value',
];

/** @deprecated v1 engine keys — retained for read/migration. */
export const FEC_V1_ENGINE_KEYS = [
  'client_growth',
  'talent_growth',
  'leadership_growth',
  'foundation',
];

export const FEC_ALL_ENGINE_KEYS = [...FEC_V1_ENGINE_KEYS, ...FEC_V2_ENGINE_KEYS];

/** Guided read order for Phase 2 UI. */
export const FEC_SPIKE_FLOW = [
  { step: 0, question: 'Unified Venture Proposition', fieldKey: 'unified_venture_proposition', kind: 'summary' },
  { step: 1, question: 'WHO has the problem?', fieldKey: 'customer_segments', engineKey: 'create_value' },
  { step: 2, question: 'WHAT problem exists?', fieldKey: 'customer_problem', engineKey: 'create_value' },
  { step: 3, question: 'WHAT value do we create?', fieldKey: 'value_offering', engineKey: 'create_value' },
  { step: 4, question: 'Can customers pay?', fieldKey: 'revenue_streams', engineKey: 'capture_value' },
  { step: 5, question: 'Can we earn profit?', fieldKey: 'profit_formula', engineKey: 'capture_value' },
  { step: 6, question: 'What resources are needed?', fieldKey: 'key_resources', engineKey: 'enable_value' },
  { step: 7, question: 'Who helps us?', fieldKey: 'key_partners', engineKey: 'enable_value' },
  { step: 8, question: 'How do we finance growth?', fieldKey: 'funding_strategy', engineKey: 'enable_value' },
  { step: 9, question: 'How do we measure success?', fieldKey: 'venture_scorecard', kind: 'scorecard' },
  { step: 10, question: 'Where in 3 years?', fieldKey: 'roadmap_success', kind: 'roadmap_success' },
];

/** @returns {Array<{ engineKey: string, fieldKey: string, label: string, minChars: number }>} */
export function listFecV2EntryFields() {
  const rows = [];
  for (const [engineKey, pillar] of Object.entries(FEC_V2_PILLARS)) {
    if (engineKey === 'prove_value') continue;
    for (const field of pillar.fields) {
      rows.push({
        engineKey,
        fieldKey: field.key,
        label: field.label,
        minChars: field.minChars,
      });
    }
  }
  for (const field of FEC_SCORECARD_FIELD_KEYS) {
    const meta = Object.values(FEC_VENTURE_SCORECARD.categories)
      .flatMap((cat) => cat.fields)
      .find((f) => f.key === field);
    rows.push({
      engineKey: 'prove_value',
      fieldKey: field,
      label: meta?.label ?? field,
      minChars: 1,
    });
  }
  for (const [engineKey, section] of Object.entries(FEC_AGENCY_BUILDER_EXTENSIONS)) {
    for (const field of section.fields) {
      rows.push({
        engineKey,
        fieldKey: field.key,
        label: field.label,
        minChars: field.minChars,
      });
    }
  }
  return rows;
}
