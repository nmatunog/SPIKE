/** Venture Blueprint™ module registry — aligns with PRD system structure. */

export const BLUEPRINT_MODULES = [
  {
    slug: 'overview',
    label: 'Overview',
    shortLabel: 'Home',
    description: 'Blueprint completion, funnels, and next actions.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'vision',
    label: 'Vision & Purpose',
    shortLabel: 'Vision',
    description: 'Mission, vision, future self narrative, and dream board.',
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
    shortLabel: 'Canvas',
    description: 'Client, talent, and leadership growth engines plus foundation.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'client-growth',
    label: 'Client Growth Engine',
    shortLabel: 'Clients',
    description: 'Production funnel, FNAs, and client KPIs.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'recruitment',
    label: 'Recruitment Engine',
    shortLabel: 'Recruitment',
    description: 'Talent pipeline for Agency Builder track.',
    tracks: ['agency_builder'],
  },
  {
    slug: 'leadership',
    label: 'Leadership Engine',
    shortLabel: 'Leadership',
    description: 'Team production and leadership pipeline.',
    tracks: ['agency_builder'],
  },
  {
    slug: 'career',
    label: 'Career Accelerator',
    shortLabel: 'Career',
    description: 'ACS progression and promotion readiness.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'milestones',
    label: 'Milestones',
    shortLabel: 'Milestones',
    description: 'Hour gates, week integrations, and milestone reviews.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'specialist',
    label: 'Specialist Blueprint',
    shortLabel: 'Specialist',
    description: 'Niche, authority, and practice growth for Specialist track.',
    tracks: ['specialist_consultant'],
  },
  {
    slug: 'venture-board',
    label: 'Venture Board',
    shortLabel: 'Board',
    description: 'Hour 200 / 400 / 600 milestone reviews.',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
  {
    slug: 'export',
    label: 'Export Center',
    shortLabel: 'Export',
    description: 'PDF, DOCX, and PPTX export (coming soon).',
    tracks: ['agency_builder', 'specialist_consultant'],
  },
];

/** @param {string} careerTrack */
export function blueprintModulesForTrack(careerTrack) {
  const track = careerTrack || 'agency_builder';
  return BLUEPRINT_MODULES.filter((mod) => mod.tracks.includes(track));
}

/** @param {string} slug */
export function getBlueprintModule(slug) {
  return BLUEPRINT_MODULES.find((mod) => mod.slug === slug);
}
