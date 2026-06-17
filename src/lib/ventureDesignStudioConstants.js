/** Venture Design Studio — Day 4 FEC workshop steps (Gemini flow + SPIKE FEC alignment). */

import { User, RefreshCw, Lightbulb, Fingerprint, Layout } from 'lucide-react';

export const VENTURE_DESIGN_STEPS_UI = [
  { id: 1, action: 'CUSTOMER', title: 'Target Insight', icon: User },
  { id: 2, action: 'TRANSFORMATION', title: 'Before & After', icon: RefreshCw },
  { id: 3, action: 'UVP', title: 'Venture Proposition', icon: Lightbulb },
  { id: 4, action: 'IDENTITY', title: 'Brand Identity', icon: Fingerprint },
  { id: 5, action: 'CANVAS', title: 'FEC Preview', icon: Layout },
];

export const VENTURE_DESIGN_STEPS = [
  { id: 1, action: 'CUSTOMER', title: 'Target Insight', coachTitle: 'Venture Review' },
  { id: 2, action: 'TRANSFORMATION', title: 'Before & After', coachTitle: 'Psychology Check' },
  { id: 3, action: 'UVP', title: 'Venture Proposition', coachTitle: 'UVP Polish' },
  { id: 4, action: 'IDENTITY', title: 'Brand Identity', coachTitle: 'Brand Cohesion' },
  { id: 5, action: 'CANVAS', title: 'The FEC Preview', coachTitle: 'Canvas Snapshot' },
];

export const BRAND_PERSONALITY_TRAITS = [
  'professional',
  'warm',
  'innovative',
  'family',
  'community',
  'premium',
];

/** @returns {Record<string, boolean>} */
export function emptyPersonality() {
  return Object.fromEntries(BRAND_PERSONALITY_TRAITS.map((t) => [t, false]));
}

/** @returns {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} */
export function emptyIndividualDraft() {
  return {
    step1: { customer: '', problem: '', opportunity: '' },
    step2: { beforeFeeling: '', afterFeeling: '' },
    step3: {
      whoServe: '',
      transformation: '',
      whyUs: '',
      different: '',
      synthesisA: '',
      synthesisB: '',
      synthesisC: '',
    },
    step4: {
      name: '',
      tagline: '',
      personality: emptyPersonality(),
      clientFeeling: '',
    },
  };
}

/** Suggestive keywords interns can tap to enrich fields. */
export const VENTURE_DESIGN_KEYWORDS = {
  1: [
    'inconsistent income',
    'no safety net',
    'insurance gap',
    'debt stress',
    'first-time earners',
    'freelancers',
    'young professionals',
    'OFW families',
  ],
  2: [
    'anxious',
    'overwhelmed',
    'unprotected',
    'confused',
    'empowered',
    'secure',
    'clear goals',
    'relieved',
    'confident',
  ],
  3: [
    'affordable protection',
    'wealth building',
    'simple language',
    'trusted advisor',
    'habit-based saving',
    'family security',
    'scalable advisory',
  ],
  4: [
    'approachable',
    'expert',
    'community-first',
    'premium service',
    'educator',
    'partner not seller',
  ],
};
