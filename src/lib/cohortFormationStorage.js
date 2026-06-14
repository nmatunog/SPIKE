/** Cohort & squad formation — local storage (works offline; Supabase optional). */

const STORAGE_KEY = 'spike_cohort_formation_v1';

export const SQUAD_NAME_EXAMPLES = [
  'Polaris', 'Catalyst', 'Momentum', 'Ascend', 'Pioneer', 'Elevate', 'Ignite', 'Horizon', 'Vanguard',
];

export const SQUAD_MOTTO_EXAMPLES = [
  'Dream Bigger.', 'Build Better.', 'Lead Forward.', 'Rise Together.', 'Execute With Purpose.',
];

export const COHORT_NAME_EXAMPLES = [
  'Ascend', 'Catalyst', 'Pioneer', 'Momentum', 'Elevate', 'Legacy', 'Ignite', 'Horizon', 'Vanguard',
];

export const COHORT_MOTTO_EXAMPLES = [
  'Dream Bigger.', 'Build Better.', 'Lead Forward.', 'Rise Together.', 'Execute With Purpose.',
];

export const COHORT_THEME_EXAMPLES = [
  'Growth', 'Innovation', 'Leadership', 'Impact', 'Service', 'Resilience',
];

export const RESEARCH_MARKETS = [
  { id: 'gen_z', label: 'Gen Z' },
  { id: 'young_professionals', label: 'Young Professionals' },
  { id: 'families', label: 'Families' },
  { id: 'ofws', label: 'OFWs' },
  { id: 'business_owners', label: 'Business Owners' },
  { id: 'healthcare_professionals', label: 'Healthcare Professionals' },
];

export const SQUAD_ROLES = [
  'Leader', 'Deputy', 'Research Lead', 'Presentation Lead', 'Documentation Lead', 'Member',
];

export const ACHIEVEMENT_BADGES = {
  founding_cohort_member: { label: 'Founding Cohort Member', emoji: '🏛️' },
  squad_charter_signatory: { label: 'Squad Charter Signatory', emoji: '✍️' },
  research_squad_member: { label: 'Research Squad Member', emoji: '🔬' },
  squad_leader: { label: 'Squad Leader', emoji: '👑' },
};

export const DEFAULT_COMMITMENT =
  'We commit to learning, growing, supporting one another, and completing the SPIKE journey with integrity, professionalism, and purpose.';

/** @returns {import('./cohortFormationService.js').FormationStore} */
export function readFormationStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/** @param {import('./cohortFormationService.js').FormationStore} data */
export function writeFormationStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @returns {import('./cohortFormationService.js').FormationStore} */
export function ensureFormationStore() {
  const store = readFormationStore();
  if (!store.suggestions) store.suggestions = [];
  if (!store.squads) store.squads = [];
  if (!store.preferences) store.preferences = {};
  if (!store.charters) store.charters = {};
  if (!store.achievements) store.achievements = {};
  if (!store.cohortVotes) store.cohortVotes = {};
  if (!store.activeThemeId) store.activeThemeId = 'constellations';
  return store;
}
