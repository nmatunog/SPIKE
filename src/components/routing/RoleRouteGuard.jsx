import { Navigate } from 'react-router-dom';
import {
  ROUTES,
  canAccessRoute,
  defaultRouteForRole,
  matchModulePath,
} from '../../routes/paths.js';

/**
 * Redirects unauthenticated module URLs, unknown paths, and role-forbidden routes
 * to the role default (dashboard).
 */
export function RoleRouteGuard({ userRole, pathname, children }) {
  if (pathname === ROUTES.home) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const route = matchModulePath(pathname);
  if (!route || !canAccessRoute(pathname, userRole)) {
    return <Navigate to={defaultRouteForRole(userRole)} replace />;
  }

  return children;
}
