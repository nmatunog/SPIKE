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
  analyticsCohortIdentity: '/analytics/cohort-identity',
};

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
};

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
    path: ROUTES.squad,
    label: 'Squad',
    shortLabel: 'Squad',
    icon: 'research',
    roles: ['intern'],
  },
  {
    path: ROUTES.dashboard,
    label: 'Home',
    shortLabel: 'Home',
    icon: 'dashboard',
    roles: ['faculty', 'mentor', 'admin'],
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
  if (pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)) {
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
  if (pathname === ROUTES.analyticsCohortIdentity) return ['faculty', 'admin', 'mentor'];
  if (pathname.startsWith(`${ROUTES.mentorVentureCoach}/`)) return ['faculty', 'mentor', 'admin'];

  const route = matchModulePath(pathname);
  if (!route) return [];
  if (route === ROUTES.dashboard) return AUTHENTICATED_ROLES;
  if (route === ROUTES.ventureBlueprint) return ['intern'];
  const item = MODULE_NAV.find((entry) => entry.path === route);
  return item?.roles ?? [];
}

export function canAccessRoute(pathname, userRole) {
  if (!AUTHENTICATED_ROLES.includes(userRole)) return false;
  return rolesForRoute(pathname).includes(userRole);
}

/** @param {string} [userRole] */
export function defaultRouteForRole(userRole) {
  if (userRole === 'intern') return ROUTES.ventureBlueprint;
  return ROUTES.dashboard;
}
