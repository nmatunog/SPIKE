/**
 * Week 3 Day 5 — FEC pitch boxes 4–8 (simplified for Financial Advisory Venture pitch).
 */

/** @typedef {'client_experience' | 'winning_strategy' | 'growth_engines' | 'key_partners' | 'financial_engine'} Week3Day5PitchBoxId */

/**
 * @typedef {Object} Week3Day5PitchColumnDef
 * @property {string} id
 * @property {string} label
 * @property {string} pitchHint
 * @property {string} engineKey
 * @property {string} fieldKey
 * @property {number} [maxPitchChars]
 */

/**
 * @typedef {Object} Week3Day5PitchBoxDef
 * @property {Week3Day5PitchBoxId} id
 * @property {number} number
 * @property {string} label
 * @property {string} pitchHint
 * @property {string} [engineKey]
 * @property {string} [fieldKey]
 * @property {string} [fecStepId]
 * @property {number} maxPitchChars
 * @property {Week3Day5PitchColumnDef[]} [columns]
 */

/** @type {Week3Day5PitchBoxDef[]} */
export const WEEK3_DAY5_PITCH_BOXES = [
  {
    id: 'client_experience',
    number: 4,
    label: 'Client Experience',
    pitchHint: 'How clients feel working with you — 2–3 short sentences for your pitch.',
    engineKey: 'create_value',
    fieldKey: 'value_offering',
    fecStepId: 'fec-step-4',
    maxPitchChars: 320,
  },
  {
    id: 'winning_strategy',
    number: 5,
    label: 'Winning Strategy',
    pitchHint: 'How you attract, engage, and retain clients — bullets work well.',
    engineKey: 'agency_leadership',
    fieldKey: 'growth_multipliers',
    fecStepId: 'fec-step-5',
    maxPitchChars: 320,
  },
  {
    id: 'growth_engines',
    number: 6,
    label: 'Growth Engines',
    pitchHint: 'Advisor excellence · team · systems — how your practice scales.',
    engineKey: 'agency_talent',
    fieldKey: 'talent_development_system',
    maxPitchChars: 360,
  },
  {
    id: 'key_partners',
    number: 7,
    label: 'Key Partners',
    pitchHint: 'Who helps you win — especially why AIA is your business platform.',
    engineKey: 'enable_value',
    fieldKey: 'key_partners',
    maxPitchChars: 320,
  },
  {
    id: 'financial_engine',
    number: 8,
    label: 'Financial Engine',
    pitchHint: 'Revenue model, economics, and sustainability — how your venture captures value.',
    maxPitchChars: 360,
    columns: [
      {
        id: 'revenue_model',
        label: 'Revenue Model',
        pitchHint: 'Revenue streams, pricing, and Year 1 targets — pitch-ready.',
        engineKey: 'capture_value',
        fieldKey: 'revenue_streams',
        maxPitchChars: 360,
      },
      {
        id: 'economics',
        label: 'Economics',
        pitchHint: 'Cost structure, margin, and operating leverage.',
        engineKey: 'capture_value',
        fieldKey: 'cost_structure',
        maxPitchChars: 320,
      },
      {
        id: 'sustainability',
        label: 'Sustainability',
        pitchHint: 'Profit formula, cash flow, break-even, and reinvestment.',
        engineKey: 'capture_value',
        fieldKey: 'profit_formula',
        maxPitchChars: 320,
      },
    ],
  },
];

/** @param {Week3Day5PitchBoxId} boxId */
export function getWeek3Day5PitchBoxDef(boxId) {
  return WEEK3_DAY5_PITCH_BOXES.find((box) => box.id === boxId) ?? null;
}

/** @param {Week3Day5PitchBoxId} boxId @param {string} [columnId] */
export function week3Day5PitchDraftKey(boxId, columnId) {
  return columnId ? `${boxId}:${columnId}` : boxId;
}
