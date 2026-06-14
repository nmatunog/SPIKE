import { Navigate } from 'react-router-dom';
import {
  ROUTES,
  canAccessRoute,
  canonicalizePathname,
  defaultRouteForRole,
  matchModulePath,
} from '../../routes/paths.js';

/**
 * Redirects unauthenticated module URLs, unknown paths, and role-forbidden routes
 * to the role default (dashboard).
 */
export function RoleRouteGuard({ userRole, pathname, children }) {
  const canonicalPath = canonicalizePathname(pathname);
  if (canonicalPath !== pathname) {
    return <Navigate to={canonicalPath} replace />;
  }

  if (canonicalPath === ROUTES.home) {
    return <Navigate to={defaultRouteForRole(userRole)} replace />;
  }

  const route = matchModulePath(canonicalPath);
  if (!route || !canAccessRoute(canonicalPath, userRole)) {
    return <Navigate to={defaultRouteForRole(userRole)} replace />;
  }

  return children;
}
