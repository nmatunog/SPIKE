export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  ventureBlueprint: '/venture-blueprint',
  playbook: '/playbook',
  portfolio: '/portfolio',
  research: '/research',
  reports: '/reports',
  admin: '/admin',
};

/** Blueprint sub-routes (PR4) — Business Plan, Milestones, Venture Board live inside the OS. */
export const BLUEPRINT_LINKS = {
  businessPlan: '/venture-blueprint/canvas',
  marketIntelligence: '/venture-blueprint/market-intelligence',
  milestones: '/venture-blueprint/milestones',
  ventureBoard: '/venture-blueprint/venture-board',
  vision: '/venture-blueprint/vision',
};

/** Module nav entries — filtered by role in ModuleNav. */
export const MODULE_NAV = [
  {
    path: ROUTES.ventureBlueprint,
    label: 'My Blueprint',
    icon: 'blueprint',
    roles: ['intern'],
  },
  {
    path: ROUTES.dashboard,
    label: 'Dashboard',
    icon: 'dashboard',
    roles: ['faculty', 'mentor', 'admin'],
  },
  { path: ROUTES.playbook, label: 'Playbook', icon: 'playbook', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.portfolio, label: 'Portfolio', icon: 'portfolio', roles: ['faculty', 'mentor', 'admin'] },
  { path: ROUTES.research, label: 'Research', icon: 'research', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.reports, label: 'Reports', icon: 'reports', roles: ['faculty', 'mentor', 'admin'] },
  { path: ROUTES.admin, label: 'Admin', icon: 'admin', roles: ['admin'] },
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
