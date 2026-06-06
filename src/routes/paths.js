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

export function isModulePath(pathname) {
  return Object.values(ROUTES).some(
    (route) => route !== ROUTES.home && (pathname === route || pathname.startsWith(`${route}/`)),
  );
}
