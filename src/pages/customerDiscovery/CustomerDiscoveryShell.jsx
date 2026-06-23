import { Navigate, useLocation } from 'react-router-dom';
import { playbookWeek2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * Week 2 SPIKE Studio — routes to mission-first Playbook.
 */
export function CustomerDiscoveryShell() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const taskSlug = segments[segments.length - 1] === 'customer-discovery'
    ? 'mission'
    : segments[segments.length - 1] ?? 'mission';
  return <Navigate to={playbookWeek2MissionHref(taskSlug, { day: 1 })} replace />;
}
