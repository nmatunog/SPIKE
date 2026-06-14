export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  ventureBlueprint: '/venture-blueprint',
  playbook: '/playbook',
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
  programCoachPlaybook: '/program-coach/playbook',
  programCoachGuides: '/admin/content-studio/program-coach-guides',
  adminProgramCoachPlaybook: '/admin/program-coach-playbook',
  mentorHome: '/mentor',
  mentorPlaybook: '/mentor/playbook',
  adminMentorPlaybook: '/admin/mentor-playbook',
  myVenturePortfolio: '/my-venture-portfolio',
  adminPortfolioSettings: '/admin/portfolio-settings',
  brandLexicon: '/brand-lexicon',
};

/** Redirect target after onboarding completes — Build Challenge 1 (Ambition). */
export const ONBOARDING_EXIT_HREF = `${ROUTES.ventureBlueprint}/coach/ambition`;

/** Blueprint sub-routes (PR4) — Business Plan, Milestones, Venture Board live inside the OS. */
export const BLUEPRINT_LINKS = {
  businessPlan: '/venture-blueprint/canvas',
  canvasSummary: '/venture-blueprint/canvas/summary',
  day1Builders: '/venture-blueprint/day-1-builders',
  cohortIdentity: '/cohort-identity',
  squadPreferences: '/squad-preferences',
  squad: '/squad',
  squadCharter: '/squad-charter',
  marketIntelligence: '/venture-blueprint/market-intelligence',
  milestones: '/venture-blueprint/milestones',
  ventureBoard: '/venture-blueprint/venture-board',
  vision: '/venture-blueprint/vision',
  ventureCoach: '/venture-blueprint/coach',
  venturePortfolio: '/my-venture-portfolio',
};

/** @param {string} pathname @param {string[]} validSectionIds */
export function portfolioSectionFromPath(pathname, validSectionIds) {
  if (pathname === ROUTES.myVenturePortfolio) return 'overview';
  const prefix = `${ROUTES.myVenturePortfolio}/`;
  if (!pathname.startsWith(prefix)) return 'overview';
  const slug = pathname.slice(prefix.length).split('/').filter(Boolean)[0] ?? 'overview';
  return validSectionIds.includes(slug) ? slug : 'overview';
}

const INTERN_FORMATION_ROUTES = [
  ROUTES.cohortIdentity,
  ROUTES.squadPreferences,
  ROUTES.squad,
  ROUTES.squadCharter,
];

/** Module nav entries — filtered by role in ModuleNav. */
export const MODULE_NAV = [
  {
    path: ROUTES.ventureBlueprint,
    label: 'Blueprint',
    shortLabel: 'Blueprint',
    icon: 'blueprint',
    roles: ['intern'],
  },
  {
    path: ROUTES.myVenturePortfolio,
    label: 'My Portfolio',
    shortLabel: 'Portfolio',
    icon: 'portfolio',
    roles: ['intern'],
  },
  {
    path: ROUTES.squad,
    label: 'Squad',
    shortLabel: 'Squad',
    icon: 'research',
    roles: ['intern'],
  },
  {
    path: ROUTES.programCoachHome,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
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
    path: ROUTES.dashboard,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
    roles: ['admin'],
  },
  {
    path: ROUTES.playbook,
    label: 'Playbook',
    shortLabel: 'Playbook',
    icon: 'playbook',
    roles: ['intern', 'faculty', 'mentor', 'admin'],
  },
  {
    path: ROUTES.portfolio,
    label: 'Portfolio',
    shortLabel: 'Portfolio',
    icon: 'portfolio',
    roles: ['faculty', 'mentor', 'admin'],
  },
  {
    path: ROUTES.research,
    label: 'Research',
    shortLabel: 'Research',
    icon: 'research',
    roles: ['intern', 'faculty', 'mentor', 'admin'],
  },
  {
    path: ROUTES.reports,
    label: 'Reports',
    shortLabel: 'Reports',
    icon: 'reports',
    roles: ['faculty', 'mentor', 'admin'],
  },
  {
    path: ROUTES.mentorVentureCoach,
    label: 'Participants',
    shortLabel: 'People',
    icon: 'people',
    roles: ['mentor', 'admin'],
  },
  {
    path: ROUTES.analyticsCohortIdentity,
    label: 'Analytics',
    shortLabel: 'Stats',
    icon: 'analytics',
    roles: ['faculty', 'mentor', 'admin'],
  },
  {
    path: ROUTES.admin,
    label: 'Admin',
    shortLabel: 'Admin',
    icon: 'admin',
    roles: ['admin'],
  },
];

export function moduleNavForRole(userRole) {
  return MODULE_NAV.filter((item) => item.roles.includes(userRole));
}

const BLUEPRINT_ALIAS_PATHS = Object.values(BLUEPRINT_LINKS);

/** Resolve a URL to a canonical module route, or null if unknown. */
export function matchModulePath(pathname) {
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
  if (pathname === ROUTES.programCoachHome || pathname.startsWith(`${ROUTES.programCoachHome}/`)) {
    return ROUTES.programCoachHome;
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
  if (
    pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)
    || pathname.startsWith(`${ROUTES.mentorParticipant}/`)
  ) {
    return ROUTES.mentorVentureCoach;
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

const AUTHENTICATED_ROLES = ['intern', 'faculty', 'mentor', 'admin'];

/** Roles allowed on a module route (single source of truth with MODULE_NAV). */
export function rolesForRoute(pathname) {
  if (INTERN_FORMATION_ROUTES.includes(pathname)) return ['intern'];
  if (pathname === ROUTES.adminCohorts || pathname === ROUTES.adminSquadThemes) return ['admin'];
  if (pathname === ROUTES.adminSquads) return ['admin', 'faculty'];
  if (pathname === ROUTES.adminContentStudio || pathname.startsWith(`${ROUTES.adminContentStudio}/`)) {
    return ['admin', 'faculty'];
  }
  if (pathname === ROUTES.adminPortfolioSettings) return ['admin', 'faculty'];
  if (pathname === ROUTES.adminProgramCoachPlaybook) return ['admin', 'faculty'];
  if (pathname === ROUTES.adminMentorPlaybook) return ['admin', 'mentor'];
  if (pathname === ROUTES.programCoachHome || pathname.startsWith(`${ROUTES.programCoachHome}/`)) {
    return ['faculty', 'admin'];
  }
  if (pathname === ROUTES.mentorHome || pathname.startsWith(`${ROUTES.mentorHome}/`)) {
    return ['mentor', 'admin'];
  }
  if (pathname === ROUTES.analyticsCohortIdentity) return ['faculty', 'admin', 'mentor'];
  if (pathname === ROUTES.brandLexicon) return ['faculty', 'mentor', 'admin'];
  if (
    pathname === ROUTES.mentorVentureCoach
    || pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)
    || pathname.startsWith(`${ROUTES.mentorParticipant}/`)
  ) {
    return ['mentor', 'admin'];
  }

  const route = matchModulePath(pathname);
  if (!route) return [];
  if (route === ROUTES.dashboard) return AUTHENTICATED_ROLES;
  if (route === ROUTES.ventureBlueprint || route === ROUTES.myVenturePortfolio) return ['intern'];
  const item = MODULE_NAV.find((entry) => entry.path === route);
  return item?.roles ?? [];
}

export function canAccessRoute(pathname, userRole) {
  if (!AUTHENTICATED_ROLES.includes(userRole)) return false;
  return rolesForRoute(pathname).includes(userRole);
}

/** @param {string} [userRole] */
export function brandLexiconBackHrefForRole(userRole) {
  if (userRole === 'mentor') return ROUTES.mentorHome;
  if (userRole === 'faculty') return ROUTES.programCoachHome;
  return ROUTES.dashboard;
}
export function defaultRouteForRole(userRole) {
  if (userRole === 'intern') return ROUTES.ventureBlueprint;
  if (userRole === 'faculty') return ROUTES.programCoachHome;
  if (userRole === 'mentor') return ROUTES.mentorHome;
  return ROUTES.dashboard;
}
