/** Venture Blueprint™ module registry — aligns with PRD system structure. */

export const BLUEPRINT_NAV_GROUPS = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'growth', label: 'Growth' },
  { id: 'path', label: 'Path' },
  { id: 'track', label: 'Track focus' },
  { id: 'tools', label: 'Tools' },
];

export const BLUEPRINT_MODULES = [
  {
    slug: 'overview',
    label: 'Overview',
    shortLabel: 'Home',
    description: 'Progress and your next step.',
    navGroup: 'foundation',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'vision',
    label: 'Vision & Purpose',
    shortLabel: 'Vision',
    description: 'Mission, vision, and future self.',
    navGroup: 'foundation',
    tracks: ['agency_builder', 'specialist_consultant'],
    progressWeights: [
      { key: 'mission_statement', label: 'Mission Statement', weight: 25 },
      { key: 'vision_statement', label: 'Vision Statement', weight: 25 },
      { key: 'future_self_narrative', label: 'Future Self Narrative', weight: 25 },
      { key: 'dream_board', label: 'Dream Board', weight: 25 },
    ],
  },
  {
    slug: 'canvas',
    label: 'Financial Entrepreneurship Canvas',
    shortLabel: 'Financial Canvas',
    description: 'Client, talent, and leadership engines.',
    navGroup: 'foundation',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'market-intelligence',
    label: 'Market Intelligence',
    shortLabel: 'Market',
    description: 'Survey insights and segments.',
    navGroup: 'growth',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'client-growth',
    label: 'Client Growth Engine',
    shortLabel: 'Clients',
    description: 'Production funnel and FNAs.',
    navGroup: 'growth',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'recruitment',
    label: 'Recruitment Growth Engine',
    shortLabel: 'Recruitment',
    description: 'Talent pipeline (Agency Builder).',
    navGroup: 'track',
    tracks: ['agency_builder'],
  },
  {
    slug: 'leadership',
    label: 'Leadership Growth Engine',
    shortLabel: 'Leadership',
    description: 'Culture and systems (Agency Builder).',
    navGroup: 'track',
    tracks: ['agency_builder'],
  },
  {
    slug: 'career',
    label: 'Career Accelerator',
    shortLabel: 'Career',
    description: 'ACS progression and readiness.',
    navGroup: 'path',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'milestones',
    label: 'Milestones',
    shortLabel: 'Milestones',
    description: 'Hour gates and week reviews.',
    navGroup: 'path',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'specialist',
    label: 'Specialist Blueprint',
    shortLabel: 'Specialist',
    description: 'Niche and practice growth.',
    navGroup: 'track',
    tracks: ['specialist_consultant'],
  },
  {
    slug: 'venture-board',
    label: 'Venture Board',
    shortLabel: 'Board',
    description: 'Hour 200 / 400 / 600 reviews.',
    navGroup: 'path',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'export',
    label: 'Export Center',
    shortLabel: 'Export',
    description: 'PDF and document export.',
    navGroup: 'tools',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
];

/** @param {{ slug: string, tracks: string[] }} mod */
export function isSharedBlueprintModule(mod) {
  return (
    mod.tracks.includes('agency_builder') && mod.tracks.includes('specialist_consultant')
  );
}

/** @param {string} careerTrack */
export function blueprintModulesForTrack(careerTrack) {
  if (!careerTrack || careerTrack === 'undecided') {
    return BLUEPRINT_MODULES.filter((mod) => isSharedBlueprintModule(mod));
  }
  return BLUEPRINT_MODULES.filter((mod) => mod.tracks.includes(careerTrack));
}

/** @param {string} careerTrack */
export function blueprintModulesGroupedForTrack(careerTrack) {
  const modules = blueprintModulesForTrack(careerTrack);
  return BLUEPRINT_NAV_GROUPS.map((group) => ({
    ...group,
    modules: modules.filter((mod) => mod.navGroup === group.id),
  })).filter((group) => group.modules.length > 0);
}

/** @param {string} slug */
export function getBlueprintModule(slug) {
  return BLUEPRINT_MODULES.find((mod) => mod.slug === slug);
}

/** @param {string} slug @param {string} base */
export function blueprintModulePath(slug, base = '/venture-blueprint') {
  return slug === 'overview' ? base : `${base}/${slug}`;
}
