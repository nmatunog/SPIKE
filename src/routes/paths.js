export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  playbook: '/playbook',
  portfolio: '/portfolio',
  research: '/research',
  reports: '/reports',
  admin: '/admin',
};

/** Module nav entries — filtered by role in ModuleNav. */
export const MODULE_NAV = [
  { path: ROUTES.dashboard, label: 'Dashboard', icon: 'dashboard', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.playbook, label: 'Playbook', icon: 'playbook', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.portfolio, label: 'Portfolio', icon: 'portfolio', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.research, label: 'Research', icon: 'research', roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { path: ROUTES.reports, label: 'Reports', icon: 'reports', roles: ['faculty', 'mentor', 'admin'] },
  { path: ROUTES.admin, label: 'Admin', icon: 'admin', roles: ['admin'] },
];

export function moduleNavForRole(userRole) {
  return MODULE_NAV.filter((item) => item.roles.includes(userRole));
}

/** Resolve a URL to a canonical module route, or null if unknown. */
export function matchModulePath(pathname) {
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
  const item = MODULE_NAV.find((entry) => entry.path === route);
  return item?.roles ?? [];
}

export function canAccessRoute(pathname, userRole) {
  if (!AUTHENTICATED_ROLES.includes(userRole)) return false;
  return rolesForRoute(pathname).includes(userRole);
}

export function defaultRouteForRole() {
  return ROUTES.dashboard;
}
