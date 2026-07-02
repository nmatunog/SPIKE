/** SPIKE Business Engine Canvas™ — Week 3 Day 3 workshop constants */

export const BEC_STORAGE_KEY = 'spike_business_engine_canvas';
export const BEC_AUTOSAVE_MS = 3000;
export const BEC_HISTORY_MAX = 50;

export const BEC_BRAND = {
  orange: '#F97316',
  navy: '#111827',
  gray: '#E5E7EB',
};

/** @typedef {'prospects' | 'discovery' | 'presentations' | 'clients' | 'revenue' | 'referrals'} FunnelMetricId */

export const ENGINE_STEPS = [
  { id: 'prospects', defaultValue: 10, defaultLabel: 'PROSPECTS', icon: 'users' },
  { id: 'discovery', defaultValue: 5, defaultLabel: 'DISCOVERY CONVERSATIONS', icon: 'messages' },
  { id: 'presentations', defaultValue: 3, defaultLabel: 'SOLUTION PRESENTATIONS', icon: 'presentation' },
  { id: 'clients', defaultValue: 1, defaultLabel: 'NEW CLIENT', icon: 'user-check' },
  { id: 'revenue', defaultValue: 10000, defaultLabel: 'REVENUE', icon: 'peso', currency: true },
  { id: 'referrals', defaultValue: 3, defaultLabel: 'REFERRALS', icon: 'referrals' },
];

export const WEEKLY_METRICS = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'discoveryConversations', label: 'Discovery Conversations' },
  { id: 'solutionPresentations', label: 'Solution Presentations' },
  { id: 'newClients', label: 'New Clients' },
  { id: 'revenue', label: 'Revenue', currency: true },
  { id: 'referrals', label: 'Referrals' },
];

export const MONTHLY_METRICS = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'discoverySessions', label: 'Discovery Sessions' },
  { id: 'solutionPresentations', label: 'Solution Presentations' },
  { id: 'newClients', label: 'New Clients' },
  { id: 'revenue', label: 'Revenue', currency: true },
  { id: 'referrals', label: 'Referrals' },
];

export const YEAR1_KPIS = [
  { id: 'newClients', label: 'New Clients', icon: 'user-check' },
  { id: 'revenue', label: 'Revenue', icon: 'peso', currency: true },
  { id: 'referrals', label: 'Referrals', icon: 'referrals' },
  { id: 'clientReviews', label: 'Client Reviews', icon: 'star' },
];

export const BUSINESS_LEVERS = [
  { id: 'more_prospects', label: 'More Prospects' },
  { id: 'better_discovery', label: 'Better Discovery' },
  { id: 'better_presentations', label: 'Better Presentations' },
  { id: 'higher_closing', label: 'Higher Closing Ratio' },
  { id: 'more_referrals', label: 'More Referrals' },
  { id: 'more_reviews', label: 'More Reviews' },
];

export const GROWTH_SIM_METRICS = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'presentations', label: 'Presentations' },
  { id: 'clients', label: 'Clients' },
  { id: 'revenue', label: 'Revenue', currency: true },
  { id: 'referrals', label: 'Referrals' },
];

export const FUNNEL_RATIOS = {
  prospectToDiscovery: 0.5,
  discoveryToPresentation: 0.6,
  /** 3 solution presentations → 1 new client (10–5–3–1 engine) */
  presentationToClient: 1 / 3,
  revenuePerClient: 10000,
  referralsPerClient: 3,
};

/** Weekly target row id → monthly projection row id */
export const WEEKLY_TO_MONTHLY_KEY = {
  prospects: 'prospects',
  discoveryConversations: 'discoverySessions',
  solutionPresentations: 'solutionPresentations',
  newClients: 'newClients',
  revenue: 'revenue',
  referrals: 'referrals',
};

/** Monthly projection row id → Year 1 KPI id (Monthly × 12) */
export const MONTHLY_TO_YEAR1_KEY = {
  newClients: 'newClients',
  revenue: 'revenue',
  referrals: 'referrals',
};

export const WEEKS_PER_MONTH = 4;
export const MONTHS_PER_YEAR = 12;

export const PROCESS_BANNER = [
  { label: 'SYSTEMS CREATE ACTIVITIES', icon: 'gears' },
  { label: 'ACTIVITIES CREATE CLIENTS', icon: 'clipboard' },
  { label: 'CLIENTS CREATE REVENUE', icon: 'users' },
  { label: 'REVENUE CREATES GROWTH', icon: 'chart' },
];
