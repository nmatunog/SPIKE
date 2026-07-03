import { getProgramDefinition } from '../lib/programs/index.js';

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  ventureBlueprint: '/venture-blueprint',
  playbook: '/playbook',
  playbookVentureStudio: '/playbook/venture-studio/day-3',
  playbookWeek2Studio: '/playbook/week-2-studio',
  playbookBusinessEngineCanvasPreview: '/playbook/business-engine-canvas-preview',
  playbookFecProjection: '/playbook/venture-design/fec-projection',
  playbookVentureDesignWorkshop: '/playbook/venture-design/workshop',
  portfolio: '/portfolio',
  research: '/research',
  reports: '/reports',
  admin: '/admin',
  cohortIdentity: '/cohort-identity',
  squadPreferences: '/squad-preferences',
  squad: '/squad',
  squadCharter: '/squad-charter',
  adminCohorts: '/admin/cohorts',
  adminSquadThemes: '/admin/squad-themes',
  adminSquads: '/admin/squads',
  adminContentStudio: '/admin/content-studio',
  adminContentStudioDayBuilder: '/admin/content-studio/day-builder',
  mentorVentureCoach: '/mentor/participants',
  mentorParticipant: '/mentor/participant',
  analyticsCohortIdentity: '/analytics/cohort-identity',
  programCoachHome: '/program-coach',
  programCoachRaSpike: '/program-coach/ra-spike',
  programCoachPlaybook: '/program-coach/playbook',
  programCoachSquads: '/program-coach/squads',
  programCoachStageGate: '/program-coach/stage-gate',
  programCoachGuides: '/admin/content-studio/program-coach-guides',
  adminProgramCoachPlaybook: '/admin/program-coach-playbook',
  mentorHome: '/mentor',
  mentorRaSpike: '/mentor/ra-spike',
  mentorPlaybook: '/mentor/playbook',
  mentorSquads: '/mentor/squads',
  mentorStageGate: '/mentor/stage-gate',
  adminMentorPlaybook: '/admin/mentor-playbook',
  myVenturePortfolio: '/my-venture-portfolio',
  stageGatePresentation: '/presentation/stagegate',
  pitchPanel: '/pitch-panel',
  programCoachPitchPanel: '/program-coach/pitch-panel',
  mentorPitchPanel: '/mentor/pitch-panel',
  adminPortfolioSettings: '/admin/portfolio-settings',
  brandLexicon: '/brand-lexicon',
  facilitatorsReference: '/facilitators-content-reference',
  life: '/life',
  lifeWorkshop: '/life/workshop',
  programCoachLife: '/program-coach/life',
  raSpikeHome: '/ra-spike/home',
  raSpikePlaybook: '/ra-spike/playbook',
  raSpikeSquad: '/ra-spike/squad',
  raSpikeProfile: '/ra-spike/profile',
  raSpikeOnboarding: '/ra-spike/onboarding',
  raSpikePlaybookDreamBoard: '/ra-spike/playbook/dream-board',
  raSpikePlaybookCanvasWizard: '/ra-spike/playbook/canvas-wizard',
  raSpikePlaybookPersona: '/ra-spike/playbook/persona',
  raSpikePlaybookProspecting: '/ra-spike/playbook/prospecting',
  raSpikePlaybookDiscoveryLog: '/ra-spike/playbook/discovery-log',
  raSpikeStageGate: '/ra-spike/stage-gate',
};

/** Redirect target after onboarding completes — Build Challenge 1 (Ambition). */
export const ONBOARDING_EXIT_HREF = `${ROUTES.ventureBlueprint}/coach/ambition`;

/** @param {string} pathname */
export function isSpikeLifePath(pathname) {
  return (
    pathname === ROUTES.life
    || pathname === ROUTES.lifeWorkshop
    || pathname === ROUTES.programCoachLife
  );
}

/** Full-screen SPIKE LIFE — hide portal header/nav chrome. */
export function isSpikeLifeImmersivePath(pathname) {
  return isSpikeLifePath(pathname);
}

/** @param {string} pathname */
export function isVentureBlueprintPath(pathname) {
  return (
    pathname === ROUTES.ventureBlueprint
    || pathname.startsWith(`${ROUTES.ventureBlueprint}/`)
  );
}

/** @param {string} pathname */
export function isPlaybookPath(pathname) {
  return (
    pathname === ROUTES.playbook
    || pathname === ROUTES.playbookVentureStudio
    || pathname === ROUTES.playbookWeek2Studio
    || pathname === ROUTES.playbookBusinessEngineCanvasPreview
    || pathname === ROUTES.playbookFecProjection
    || pathname === ROUTES.playbookVentureDesignWorkshop
  );
}

/**
 * Playbook Venture Design workshop — staff delivery + mentor preview (interns use Build canvas).
 * @param {{ coach?: boolean, start?: boolean }} [opts]
 */
export function ventureDesignWorkshopHref({ coach = false, start = true } = {}) {
  const params = new URLSearchParams();
  if (coach) params.set('coach', '1');
  if (start) params.set('start', '1');
  const q = params.toString();
  return q ? `${ROUTES.playbookVentureDesignWorkshop}?${q}` : ROUTES.playbookVentureDesignWorkshop;
}

/**
 * Week 2 SPIKE Studio — staff preview sandbox.
 * @param {{ day?: number, mission?: string }} [opts]
 */
export function playbookWeek2StudioHref(opts = {}) {
  const params = new URLSearchParams();
  if (opts.day) params.set('day', String(opts.day));
  if (opts.mission) params.set('mission', opts.mission);
  const q = params.toString();
  return q ? `${ROUTES.playbookWeek2Studio}?${q}` : ROUTES.playbookWeek2Studio;
}

/** Week 3 Day 3 — blank Business Engine Canvas for coach/mentor presentation. */
export function playbookBusinessEngineCanvasPreviewHref() {
  return ROUTES.playbookBusinessEngineCanvasPreview;
}

/** Blueprint sub-routes (PR4) — Business Plan, Milestones, Venture Board live inside the OS. */
export const BLUEPRINT_LINKS = {
  businessPlan: '/venture-blueprint/canvas',
  canvasEdit: '/venture-blueprint/canvas/edit',
  canvasSummary: '/venture-blueprint/canvas/summary',
  day1Builders: '/venture-blueprint/day-1-builders',
  cohortIdentity: '/cohort-identity',
  squadPreferences: '/squad-preferences',
  squad: '/squad',
  squadCharter: '/squad-charter',
  marketIntelligence: '/venture-blueprint/market-intelligence',
  customerDiscovery: '/venture-blueprint/customer-discovery',
  milestones: '/venture-blueprint/milestones',
  ventureBoard: '/venture-blueprint/venture-board',
  vision: '/venture-blueprint/vision',
  ventureCoach: '/venture-blueprint/coach',
  venturePortfolio: '/my-venture-portfolio',
};

/**
 * Deep link to Playbook curriculum day.
 * @param {{ segment?: number, week?: number, day?: number }} [opts]
 */
export function playbookHref(opts = {}) {
  const segment = opts.segment ?? 1;
  const week = opts.week ?? 1;
  const day = opts.day ?? 1;
  const params = new URLSearchParams({
    segment: String(segment),
    week: String(week),
    day: String(day),
  });
  return `${ROUTES.playbook}?${params.toString()}`;
}

/**
 * Deep link to Playbook day reflection — scrolls/focuses closing reflection on arrival.
 * @param {{ segment?: number, week?: number, day?: number }} [opts]
 */
export function playbookReflectionHref(opts = {}) {
  const base = playbookHref(opts);
  return `${base}&reflection=1`;
}

/** @param {string} pathname @param {string[]} validSectionIds */
export function portfolioSectionFromPath(pathname, validSectionIds) {
  if (pathname === ROUTES.myVenturePortfolio) return 'overview';
  const prefix = `${ROUTES.myVenturePortfolio}/`;
  if (!pathname.startsWith(prefix)) return 'overview';
  const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0] ?? 'overview';
  return validSectionIds.includes(slug) ? slug : 'overview';
}

/**
 * Parse framework day URLs — /base/:segment/:week/:day
 * (SpikeMasterPortal uses a catch-all route; useParams does not receive these segments.)
 * @param {string} pathname
 * @param {string} basePath
 */
export function parseFrameworkDayPath(pathname, basePath) {
  const prefix = `${basePath.replace(/\/$/, '')}/`;
  if (!pathname.startsWith(prefix)) return null;
  const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
  if (parts.length < 3) return null;
  const segment = Number(parts[0]);
  const week = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(segment) || !Number.isFinite(week) || !Number.isFinite(day)) return null;
  return { segment, week, day };
}

/**
 * Parse /mentor/participants/:id or /mentor/participant/:id from pathname.
 * @param {string} pathname
 */
export function parseMentorParticipantPath(pathname) {
  for (const base of [ROUTES.mentorVentureCoach, ROUTES.mentorParticipant]) {
    const prefix = `${base.replace(/\/$/, '')}/`;
    if (!pathname.startsWith(prefix)) continue;
    const id = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
    if (id) return id;
  }
  return null;
}

/** @param {string} participantId */
export function mentorParticipantReviewHref(participantId, tab = '') {
  const base = `${ROUTES.mentorVentureCoach}/${participantId}`;
  if (!tab) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}

/** @param {'faculty' | 'mentor'} role */
export function staffSquadsListHref(role) {
  return role === 'mentor' ? ROUTES.mentorSquads : ROUTES.programCoachSquads;
}

/** @param {'faculty' | 'mentor'} role @param {string} squadName */
export function staffSquadHubHref(role, squadName) {
  const slug = encodeURIComponent(squadName);
  return `${staffSquadsListHref(role)}/${slug}`;
}

/**
 * @param {string} pathname
 * @param {'faculty' | 'mentor'} role
 */
export function parseStaffSquadHubPath(pathname, role) {
  const base = staffSquadsListHref(role);
  const prefix = `${base}/`;
  if (!pathname.startsWith(prefix)) return null;
  const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
  if (!slug) return null;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** @param {'faculty' | 'mentor'} role @param {number} [segment] @param {number} [closingWeek] */
export function staffStageGateHref(role, segment = 1, closingWeek = 1) {
  const base = role === 'mentor' ? ROUTES.mentorStageGate : ROUTES.programCoachStageGate;
  return `${base}/${segment}/${closingWeek}`;
}

/** @param {number} [closingWeek] */
export function stageGateCertificateHref(closingWeek = 1) {
  return `${ROUTES.myVenturePortfolio}/certificates/week${closingWeek}`;
}

/** @param {string} pathname */
export function parseStageGateCertificatePath(pathname) {
  const prefix = `${ROUTES.myVenturePortfolio}/certificates/week`;
  if (!pathname.startsWith(prefix)) return null;
  const week = Number(pathname.slice(prefix.length));
  return Number.isFinite(week) && week >= 1 ? week : null;
}

/** @param {number} [closingWeek] */
export function stageGatePresentationHref(closingWeek = 1) {
  return `${ROUTES.stageGatePresentation}?week=${closingWeek}`;
}

/**
 * FEC projection — optional participant context for staff portfolio review.
 * @param {string} [participantId]
 * @param {{ exit?: string, name?: string }} [opts]
 */
export function fecProjectionHref(participantId, opts = {}) {
  const params = new URLSearchParams();
  if (participantId) params.set('participant', participantId);
  if (opts.name) params.set('name', opts.name);
  if (opts.exit) params.set('exit', opts.exit);
  const q = params.toString();
  return q ? `${ROUTES.playbookFecProjection}?${q}` : ROUTES.playbookFecProjection;
}

/**
 * Intern self-view — projection page resolves the signed-in participant.
 * @param {{ exit?: string }} [opts]
 */
export function internFecCanvasHref(opts = {}) {
  const params = new URLSearchParams();
  if (opts.exit) params.set('exit', opts.exit);
  const q = params.toString();
  return q ? `${ROUTES.playbookFecProjection}?${q}` : ROUTES.playbookFecProjection;
}

/**
 * @param {string} pathname
 * @param {'faculty' | 'mentor'} role
 */
export function parseStaffStageGatePath(pathname, role) {
  const base = role === 'mentor' ? ROUTES.mentorStageGate : ROUTES.programCoachStageGate;
  const prefix = `${base}/`;
  if (!pathname.startsWith(prefix)) return null;
  const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const segment = Number(parts[0]);
  const closingWeek = Number(parts[1]);
  if (!Number.isFinite(segment) || !Number.isFinite(closingWeek)) return null;
  return { segment, closingWeek };
}

/** @param {string} pathname */
export function isStaffStageGatePath(pathname) {
  return (
    pathname.startsWith(`${ROUTES.programCoachStageGate}/`)
    || pathname.startsWith(`${ROUTES.mentorStageGate}/`)
  );
}

/** @param {string} pathname */
export function isStaffSquadsPath(pathname) {
  return (
    pathname === ROUTES.programCoachSquads
    || pathname.startsWith(`${ROUTES.programCoachSquads}/`)
    || pathname === ROUTES.mentorSquads
    || pathname.startsWith(`${ROUTES.mentorSquads}/`)
  );
}

/**
 * Parse /portfolio/:slug (public share). Catch-all route — do not use useParams().
 * @param {string} pathname
 */
export function parsePublicPortfolioSlug(pathname) {
  const prefix = `${ROUTES.portfolio}/`;
  if (!pathname.startsWith(prefix) || pathname === ROUTES.portfolio) return null;
  const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
  return slug || null;
}

/** @param {string} pathname */
export function isPublicPortfolioPath(pathname) {
  return Boolean(parsePublicPortfolioSlug(pathname));
}

const INTERN_FORMATION_ROUTES = [
  ROUTES.cohortIdentity,
  ROUTES.squadPreferences,
  ROUTES.squad,
  ROUTES.squadCharter,
];

/** RA-SPIKE participant shell routes. */
export const RA_SPIKE_ROUTES = [
  ROUTES.raSpikeHome,
  ROUTES.raSpikePlaybook,
  ROUTES.raSpikeSquad,
  ROUTES.raSpikeProfile,
  ROUTES.raSpikeOnboarding,
  ROUTES.raSpikeStageGate,
];

/** SPIKE Internship intern modules hidden from RA-SPIKE participants. */
export const INTERNSHIP_ONLY_INTERN_PATHS = [
  ROUTES.ventureBlueprint,
  ROUTES.myVenturePortfolio,
  ROUTES.life,
  ROUTES.lifeWorkshop,
  ROUTES.research,
  ROUTES.dashboard,
  ROUTES.playbook,
  ROUTES.playbookVentureStudio,
  ROUTES.playbookWeek2Studio,
  ROUTES.playbookBusinessEngineCanvasPreview,
  ROUTES.playbookFecProjection,
  ROUTES.playbookVentureDesignWorkshop,
  ...INTERN_FORMATION_ROUTES,
  ROUTES.squad,
];

/** @param {string} pathname */
export function isRaSpikePath(pathname) {
  return RA_SPIKE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * @param {string} stepId
 * @param {number} [week]
 */
export function raSpikePlaybookStepHref(stepId, week) {
  const base = `${ROUTES.raSpikePlaybook}/step/${stepId}`;
  return week ? `${base}?week=${week}` : base;
}

export function raSpikePlaybookDreamBoardHref() {
  return ROUTES.raSpikePlaybookDreamBoard;
}

export function raSpikePlaybookCanvasWizardHref() {
  return ROUTES.raSpikePlaybookCanvasWizard;
}

export function raSpikePlaybookPersonaHref() {
  return ROUTES.raSpikePlaybookPersona;
}

export function raSpikeStageGateHref(gate = 1, assignmentWeek) {
  const params = new URLSearchParams({ gate: String(gate) });
  if (assignmentWeek != null && Number.isFinite(Number(assignmentWeek))) {
    params.set('week', String(assignmentWeek));
  }
  return `${ROUTES.raSpikeStageGate}?${params}`;
}

/**
 * @param {string} pathname
 * @returns {{ view: 'overview' } | { view: 'dream-board' } | { view: 'canvas-wizard' } | { view: 'persona' } | { view: 'prospecting' } | { view: 'discovery-log' } | { view: 'step', stepId: string } | null}
 */
export function parseRaSpikePlaybookPath(pathname) {
  if (pathname === ROUTES.raSpikePlaybook) return { view: 'overview' };
  if (pathname === ROUTES.raSpikePlaybookDreamBoard) return { view: 'dream-board' };
  if (pathname === ROUTES.raSpikePlaybookCanvasWizard) return { view: 'canvas-wizard' };
  if (pathname === ROUTES.raSpikePlaybookPersona) return { view: 'persona' };
  if (pathname === ROUTES.raSpikePlaybookProspecting) return { view: 'prospecting' };
  if (pathname === ROUTES.raSpikePlaybookDiscoveryLog) return { view: 'discovery-log' };
  const prefix = `${ROUTES.raSpikePlaybook}/step/`;
  if (pathname.startsWith(prefix)) {
    const stepId = pathname.slice(prefix.length).split('/')[0];
    if (!stepId) return null;
    return { view: 'step', stepId };
  }
  return null;
}

/** @param {string} pathname */
export function isInternshipOnlyInternPath(pathname) {
  if (isRaSpikePath(pathname)) return false;
  if (
    pathname === ROUTES.ventureBlueprint
    || pathname.startsWith(`${ROUTES.ventureBlueprint}/`)
    || Object.values(BLUEPRINT_LINKS).includes(pathname)
  ) {
    return true;
  }
  if (pathname === ROUTES.myVenturePortfolio || pathname.startsWith(`${ROUTES.myVenturePortfolio}/`)) {
    return true;
  }
  if (isPlaybookPath(pathname)) return true;
  if (isSpikeLifePath(pathname)) return true;
  return INTERNSHIP_ONLY_INTERN_PATHS.includes(pathname);
}

/** Module nav entries — filtered by role in ModuleNav. */
export const MODULE_NAV = [
  {
    path: ROUTES.ventureBlueprint,
    label: 'My Venture',
    shortLabel: 'Venture',
    icon: 'blueprint',
    roles: ['intern'],
  },
  {
    path: ROUTES.playbook,
    label: 'Playbook',
    shortLabel: 'Playbook',
    icon: 'playbook',
    roles: ['intern', 'faculty', 'mentor', 'admin', 'superuser'],
  },
  {
    path: ROUTES.myVenturePortfolio,
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: 'portfolio',
    roles: ['intern'],
  },
  {
    path: ROUTES.life,
    label: 'SPIKE LIFE',
    shortLabel: 'Life',
    icon: 'playbook',
    roles: ['intern', 'faculty', 'mentor', 'admin', 'superuser'],
  },
  {
    path: ROUTES.programCoachHome,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
    roles: ['faculty'],
  },
  {
    path: ROUTES.programCoachSquads,
    label: 'Squads',
    shortLabel: 'Squads',
    icon: 'people',
    roles: ['faculty'],
  },
  {
    path: ROUTES.mentorHome,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
    roles: ['mentor'],
  },
  {
    path: ROUTES.mentorSquads,
    label: 'Squads',
    shortLabel: 'Squads',
    icon: 'people',
    roles: ['mentor'],
  },
  {
    path: ROUTES.dashboard,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
    roles: ['admin', 'superuser'],
  },
  {
    path: ROUTES.mentorVentureCoach,
    label: 'People',
    shortLabel: 'People',
    icon: 'people',
    roles: ['mentor', 'faculty'],
  },
  {
    path: ROUTES.portfolio,
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: 'portfolio',
    roles: ['faculty', 'mentor', 'admin', 'superuser'],
  },
  {
    path: ROUTES.mentorVentureCoach,
    label: 'People',
    shortLabel: 'People',
    icon: 'people',
    roles: ['admin', 'superuser'],
  },
  {
    path: ROUTES.admin,
    label: 'Admin',
    shortLabel: 'Admin',
    icon: 'admin',
    roles: ['admin', 'superuser'],
  },
];

/** Curated nav when signed in as superuser (not role-preview). */
const SUPERUSER_MODULE_NAV = [
  {
    path: ROUTES.dashboard,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
  },
  {
    path: ROUTES.mentorVentureCoach,
    label: 'People',
    shortLabel: 'People',
    icon: 'people',
  },
  {
    path: ROUTES.playbook,
    label: 'Playbook',
    shortLabel: 'Playbook',
    icon: 'playbook',
  },
  {
    path: ROUTES.portfolio,
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: 'portfolio',
  },
  {
    path: ROUTES.admin,
    label: 'Admin',
    shortLabel: 'Admin',
    icon: 'admin',
  },
];

export function moduleNavForRole(userRole) {
  return moduleNavForProgram(userRole, null);
}

/**
 * Top navigation for a role within a program context.
 * @param {string} userRole
 * @param {string | null | undefined} programSlug
 */
export function moduleNavForProgram(userRole, programSlug) {
  if (userRole === 'intern' && programSlug === 'ra-spike') {
    return getProgramDefinition(programSlug).nav;
  }
  if (userRole === 'superuser') {
    return SUPERUSER_MODULE_NAV;
  }
  const seen = new Set();
  return MODULE_NAV.filter((item) => {
    if (!item.roles.includes(userRole)) return false;
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

/** Active top-nav module for interns (Build includes squad + formation routes). */
export function internNavActiveModule(pathname) {
  return internNavActiveModuleForProgram(pathname, null);
}

/** @param {string} pathname @param {string | null | undefined} programSlug */
export function internNavActiveModuleForProgram(pathname, programSlug) {
  if (programSlug === 'ra-spike' || isRaSpikePath(pathname)) {
    const match = RA_SPIKE_ROUTES.find(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    return match ?? ROUTES.raSpikeHome;
  }
  if (
    pathname === ROUTES.ventureBlueprint
    || pathname.startsWith(`${ROUTES.ventureBlueprint}/`)
    || INTERN_FORMATION_ROUTES.includes(pathname)
  ) {
    return ROUTES.ventureBlueprint;
  }
  if (pathname === ROUTES.playbook) return ROUTES.playbook;
  if (pathname === ROUTES.myVenturePortfolio || pathname.startsWith(`${ROUTES.myVenturePortfolio}/`)) {
    return ROUTES.myVenturePortfolio;
  }
  return matchModulePath(pathname);
}

/** Portfolio primary tabs (Phase 2 — fewer sidebar items). */
export const PORTFOLIO_TABS = [
  { id: 'overview', label: 'Overview', sections: ['overview'] },
  { id: 'identity', label: 'Identity', sections: ['identity', 'dream-board', 'career'] },
  { id: 'work', label: 'Work', sections: ['canvas', 'research', 'deliverables'] },
  { id: 'share', label: 'Share', sections: ['presentations', 'certifications', 'stage-gate-certificates', 'export', 'milestones'] },
];

const PORTFOLIO_SECTION_TO_TAB = Object.fromEntries(
  PORTFOLIO_TABS.flatMap((tab) => tab.sections.map((section) => [section, tab.id])),
);

/** @param {string} sectionId */
export function portfolioTabForSection(sectionId) {
  return PORTFOLIO_SECTION_TO_TAB[sectionId] ?? 'overview';
}

/** @param {string} pathname */
export function portfolioTabFromPath(pathname) {
  if (pathname === ROUTES.myVenturePortfolio) return 'overview';
  const prefix = `${ROUTES.myVenturePortfolio}/`;
  if (!pathname.startsWith(prefix)) return 'overview';
  const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0] ?? 'overview';
  if (PORTFOLIO_TABS.some((tab) => tab.id === slug)) return slug;
  return portfolioTabForSection(slug);
}

const BLUEPRINT_ALIAS_PATHS = Object.values(BLUEPRINT_LINKS);

/** Resolve a URL to a canonical module route, or null if unknown. */
export function matchModulePath(pathname) {
  if (isRaSpikePath(pathname)) {
    const match = RA_SPIKE_ROUTES.find(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    return match ?? ROUTES.raSpikeHome;
  }

  if (
    pathname === ROUTES.ventureBlueprint
    || pathname.startsWith(`${ROUTES.ventureBlueprint}/`)
    || BLUEPRINT_ALIAS_PATHS.includes(pathname)
  ) {
    return ROUTES.ventureBlueprint;
  }

  if (INTERN_FORMATION_ROUTES.includes(pathname)) {
    return pathname;
  }

  if (pathname === ROUTES.adminCohorts || pathname.startsWith(`${ROUTES.adminCohorts}/`)) {
    return ROUTES.adminCohorts;
  }
  if (pathname === ROUTES.adminSquadThemes || pathname.startsWith(`${ROUTES.adminSquadThemes}/`)) {
    return ROUTES.adminSquadThemes;
  }
  if (pathname === ROUTES.adminSquads || pathname.startsWith(`${ROUTES.adminSquads}/`)) {
    return ROUTES.adminSquads;
  }
  if (pathname === ROUTES.adminContentStudio || pathname.startsWith(`${ROUTES.adminContentStudio}/`)) {
    return ROUTES.adminContentStudio;
  }
  if (pathname === ROUTES.analyticsCohortIdentity) {
    return ROUTES.analyticsCohortIdentity;
  }
  if (pathname === ROUTES.brandLexicon) {
    return ROUTES.brandLexicon;
  }
  if (pathname === ROUTES.facilitatorsReference) {
    return ROUTES.facilitatorsReference;
  }
  if (pathname === ROUTES.lifeWorkshop) {
    return ROUTES.lifeWorkshop;
  }
  if (pathname === ROUTES.programCoachLife) {
    return ROUTES.programCoachLife;
  }
  if (pathname === ROUTES.life) {
    return ROUTES.life;
  }
  if (pathname === ROUTES.programCoachSquads || pathname.startsWith(`${ROUTES.programCoachSquads}/`)) {
    return ROUTES.programCoachSquads;
  }
  if (pathname === ROUTES.mentorSquads || pathname.startsWith(`${ROUTES.mentorSquads}/`)) {
    return ROUTES.mentorSquads;
  }
  if (pathname === ROUTES.programCoachSquads || pathname.startsWith(`${ROUTES.programCoachSquads}/`)) {
    return ROUTES.programCoachSquads;
  }
  if (pathname === ROUTES.mentorSquads || pathname.startsWith(`${ROUTES.mentorSquads}/`)) {
    return ROUTES.mentorSquads;
  }
  if (pathname === ROUTES.programCoachRaSpike || pathname.startsWith(`${ROUTES.programCoachRaSpike}/`)) {
    return ROUTES.programCoachRaSpike;
  }
  if (pathname === ROUTES.programCoachHome || pathname.startsWith(`${ROUTES.programCoachHome}/`)) {
    return ROUTES.programCoachHome;
  }
  if (
    pathname === ROUTES.mentorVentureCoach
    || pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)
    || pathname.startsWith(`${ROUTES.mentorParticipant}/`)
  ) {
    return ROUTES.mentorVentureCoach;
  }
  if (pathname === ROUTES.mentorRaSpike || pathname.startsWith(`${ROUTES.mentorRaSpike}/`)) {
    return ROUTES.mentorRaSpike;
  }
  if (pathname === ROUTES.mentorHome || pathname.startsWith(`${ROUTES.mentorHome}/`)) {
    return ROUTES.mentorHome;
  }
  if (pathname === ROUTES.adminProgramCoachPlaybook) return ROUTES.adminProgramCoachPlaybook;
  if (pathname === ROUTES.adminMentorPlaybook) return ROUTES.adminMentorPlaybook;
  if (pathname === ROUTES.adminPortfolioSettings) return ROUTES.adminPortfolioSettings;
  if (pathname === ROUTES.myVenturePortfolio || pathname.startsWith(`${ROUTES.myVenturePortfolio}/`)) {
    return ROUTES.myVenturePortfolio;
  }
  if (isPublicPortfolioPath(pathname)) {
    return ROUTES.portfolio;
  }

  for (const route of Object.values(ROUTES)) {
    if (route === ROUTES.home) continue;
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return route;
    }
  }
  return null;
}

/** @param {string} pathname */
export function canonicalizePathname(pathname) {
  if (pathname === '/admin/faculty-playbook') {
    return ROUTES.adminProgramCoachPlaybook;
  }
  if (pathname.startsWith('/admin/content-studio/faculty-guides')) {
    return pathname.replace('/faculty-guides', '/program-coach-guides');
  }
  if (pathname === '/faculty' || pathname.startsWith('/faculty/')) {
    return pathname.replace(/^\/faculty(?=\/|$)/, '/program-coach');
  }
  return pathname;
}

export function isModulePath(pathname) {
  return matchModulePath(pathname) !== null;
}

const AUTHENTICATED_ROLES = ['intern', 'faculty', 'mentor', 'admin', 'superuser'];

/** Roles allowed on a module route (single source of truth with MODULE_NAV). */
export function rolesForRoute(pathname) {
  if (isRaSpikePath(pathname)) return ['intern'];
  if (isPublicPortfolioPath(pathname)) return AUTHENTICATED_ROLES;
  if (INTERN_FORMATION_ROUTES.includes(pathname)) return ['intern'];
  if (pathname === ROUTES.adminCohorts || pathname === ROUTES.adminSquadThemes) return ['admin', 'superuser'];
  if (pathname === ROUTES.adminSquads) return ['admin', 'superuser', 'faculty'];
  if (pathname === ROUTES.adminContentStudio || pathname.startsWith(`${ROUTES.adminContentStudio}/`)) {
    return ['admin', 'superuser', 'faculty'];
  }
  if (pathname === ROUTES.adminPortfolioSettings) return ['admin', 'superuser', 'faculty'];
  if (pathname === ROUTES.life || pathname === ROUTES.lifeWorkshop) {
    return ['intern', 'faculty', 'mentor', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.programCoachLife) {
    return ['faculty', 'mentor', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.playbookWeek2Studio) return ['faculty', 'mentor', 'admin', 'superuser'];
  if (pathname === ROUTES.playbookBusinessEngineCanvasPreview) return ['faculty', 'mentor', 'admin', 'superuser'];
  if (pathname === ROUTES.adminProgramCoachPlaybook) return ['admin', 'superuser', 'faculty'];
  if (pathname === ROUTES.adminMentorPlaybook) return ['admin', 'superuser', 'mentor'];
  if (pathname === ROUTES.programCoachRaSpike || pathname.startsWith(`${ROUTES.programCoachRaSpike}/`)) {
    return ['faculty', 'mentor', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.programCoachHome || pathname.startsWith(`${ROUTES.programCoachHome}/`)) {
    return ['faculty', 'admin', 'superuser'];
  }
  if (
    pathname === ROUTES.mentorVentureCoach
    || pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)
    || pathname.startsWith(`${ROUTES.mentorParticipant}/`)
  ) {
    return ['mentor', 'faculty', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.mentorRaSpike || pathname.startsWith(`${ROUTES.mentorRaSpike}/`)) {
    return ['faculty', 'mentor', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.mentorHome || pathname.startsWith(`${ROUTES.mentorHome}/`)) {
    return ['mentor', 'admin', 'superuser'];
  }
  if (pathname === ROUTES.analyticsCohortIdentity) return ['faculty', 'admin', 'mentor', 'superuser'];
  if (pathname === ROUTES.research) return ['intern', 'faculty', 'admin', 'mentor', 'superuser'];
  if (pathname === ROUTES.reports) return ['faculty', 'admin', 'mentor', 'superuser'];
  if (pathname === ROUTES.brandLexicon) return ['faculty', 'mentor', 'admin', 'superuser'];
  if (pathname === ROUTES.facilitatorsReference) return ['faculty', 'mentor', 'admin', 'superuser'];

  const route = matchModulePath(pathname);
  if (!route) return [];
  if (route === ROUTES.dashboard) return AUTHENTICATED_ROLES;
  if (route === ROUTES.ventureBlueprint || route === ROUTES.myVenturePortfolio) return ['intern'];
  const item = MODULE_NAV.find((entry) => entry.path === route);
  return item?.roles ?? [];
}

export function canAccessRoute(pathname, userRole) {
  return canAccessRouteForProgram(pathname, userRole, null);
}

/**
 * Program-aware route access — RA-SPIKE interns are confined to their shell routes.
 * @param {string} pathname
 * @param {string} userRole
 * @param {string | null | undefined} programSlug
 */
export function canAccessRouteForProgram(pathname, userRole, programSlug) {
  if (isPublicPortfolioPath(pathname)) return true;
  if (!AUTHENTICATED_ROLES.includes(userRole)) return false;

  if (userRole === 'intern' && programSlug === 'ra-spike') {
    if (isInternshipOnlyInternPath(pathname)) return false;
    if (isRaSpikePath(pathname)) return true;
    return false;
  }

  if (userRole === 'intern' && programSlug !== 'ra-spike' && isRaSpikePath(pathname)) {
    return false;
  }

  if (userRole === 'superuser') {
    if (INTERN_FORMATION_ROUTES.includes(pathname)) return true;
    return Boolean(matchModulePath(pathname));
  }
  return rolesForRoute(pathname).includes(userRole);
}

/** @param {string} [userRole] */
export function brandLexiconBackHrefForRole(userRole) {
  if (userRole === 'mentor') return ROUTES.mentorHome;
  if (userRole === 'faculty') return ROUTES.programCoachHome;
  return ROUTES.dashboard;
}

/** @param {string} [userRole] */
export function facilitatorsReferenceBackHrefForRole(userRole) {
  return brandLexiconBackHrefForRole(userRole);
}
export function defaultRouteForRole(userRole, programSlug) {
  if (userRole === 'intern') {
    if (programSlug === 'ra-spike') return ROUTES.raSpikeHome;
    return ROUTES.ventureBlueprint;
  }
  if (userRole === 'faculty') return ROUTES.programCoachHome;
  if (userRole === 'mentor') return ROUTES.mentorHome;
  return ROUTES.dashboard;
}
