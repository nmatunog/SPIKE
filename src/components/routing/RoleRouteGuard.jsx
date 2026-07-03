import { Navigate } from 'react-router-dom';
import {
  ROUTES,
  canAccessRouteForProgram,
  canonicalizePathname,
  defaultRouteForRole,
  isRaSpikeAppPath,
  matchModulePath,
} from '../../routes/paths.js';

/**
 * Redirects unauthenticated module URLs, unknown paths, and role-forbidden routes
 * to the role default (dashboard).
 */
export function RoleRouteGuard({ userRole, pathname, programSlug = null, children }) {
  const canonicalPath = canonicalizePathname(pathname);
  if (canonicalPath !== pathname) {
    return <Navigate to={canonicalPath} replace />;
  }

  const raSpikeApp = isRaSpikeAppPath(canonicalPath);

  if (canonicalPath === ROUTES.home || canonicalPath === '/ra-spike' || canonicalPath === '/ra-spike/') {
    return (
      <Navigate
        to={defaultRouteForRole(userRole, programSlug, { raSpikeApp: true })}
        replace
      />
    );
  }

  const route = matchModulePath(canonicalPath);
  if (!route || !canAccessRouteForProgram(canonicalPath, userRole, programSlug)) {
    return (
      <Navigate
        to={defaultRouteForRole(userRole, programSlug, { raSpikeApp })}
        replace
      />
    );
  }

  return children;
}
