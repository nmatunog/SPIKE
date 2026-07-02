/**
 * Week 3 Day 5 — FEC pitch boxes 4–7 (simplified for Financial Advisory Venture pitch).
 */

/** @typedef {'client_experience' | 'winning_strategy' | 'growth_engines' | 'key_partners'} Week3Day5PitchBoxId */

/**
 * @typedef {Object} Week3Day5PitchBoxDef
 * @property {Week3Day5PitchBoxId} id
 * @property {number} number
 * @property {string} label
 * @property {string} pitchHint
 * @property {string} engineKey
 * @property {string} fieldKey
 * @property {string} [fecStepId]
 * @property {number} maxPitchChars
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
    fieldKey: 'leadership_system',
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
];

/** @param {Week3Day5PitchBoxId} boxId */
export function getWeek3Day5PitchBoxDef(boxId) {
  return WEEK3_DAY5_PITCH_BOXES.find((box) => box.id === boxId) ?? null;
}
