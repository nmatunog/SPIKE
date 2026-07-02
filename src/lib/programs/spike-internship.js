import { PROGRAM_SLUGS } from './constants.js';

/** @type {import('./index.js').ProgramDefinition} */
export const SPIKE_INTERNSHIP_PROGRAM = {
  slug: PROGRAM_SLUGS.SPIKE_INTERNSHIP,
  title: 'SPIKE Internship',
  tagline: 'SPIKE Venture Studio',
  theme: 'Venture Studio',
  defaultRoute: '/venture-blueprint',
  totalWeeks: 5,
  unlockPolicy: 'pilot',
  segments: [{ id: 'segment-1', label: 'Proof of Concept', weeks: [1, 2, 3, 4, 5] }],
  stageGates: [],
  graduationTarget: null,
  nav: [],
};
