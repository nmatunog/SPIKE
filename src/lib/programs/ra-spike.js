import { PROGRAM_SLUGS } from './constants.js';

/** @type {import('./index.js').ProgramDefinition} */
export const RA_SPIKE_PROGRAM = {
  slug: PROGRAM_SLUGS.RA_SPIKE,
  title: 'RA-SPIKE',
  tagline: 'Rookie Academy – SPIKE Edition',
  theme: 'Build Your Business. Master Your Craft.',
  defaultRoute: '/ra-spike/home',
  totalWeeks: 8,
  unlockPolicy: 'strict',
  segments: [
    { id: 'discover', label: 'DISCOVER', weeks: [1, 2, 3, 4] },
    { id: 'advise', label: 'ADVISE', weeks: [5, 6, 7, 8] },
  ],
  stageGates: [
    {
      id: 'venture-pitch',
      week: 4,
      segment: 'discover',
      title: 'Business Plan & Venture Pitch',
      label: 'Stage Gate 1',
    },
    {
      id: 'advisor-revalida',
      week: 8,
      segment: 'advise',
      title: 'Advisor Revalida',
      label: 'Stage Gate 2',
    },
  ],
  graduationTarget: null,
  nav: [
    { path: '/ra-spike/home', label: 'Home', shortLabel: 'Home', icon: 'dashboard' },
    { path: '/ra-spike/playbook', label: 'Playbook', shortLabel: 'Playbook', icon: 'playbook' },
    { path: '/ra-spike/squad', label: 'Squad', shortLabel: 'Squad', icon: 'people' },
    { path: '/ra-spike/profile', label: 'Profile', shortLabel: 'Profile', icon: 'analytics' },
  ],
  /** Modules only when week content is authored (see content/ra-spike/week-N.json). */
  weekModuleMap: {
    1: ['dream-board'],
  },
};
