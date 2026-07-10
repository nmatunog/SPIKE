import { ROUTES, isRaSpikeAppPath } from '../../routes/paths.js';

const STANDALONE = import.meta.env.VITE_RA_SPIKE_STANDALONE === 'true';

/**
 * Normalize pathname for the RA-SPIKE standalone bundle.
 * Portal proxy keeps /ra-spike/* in the browser; pages.dev origin uses /, /coach, etc.
 * @param {string} pathname
 */
export function canonicalRaSpikePathname(pathname) {
  const path = pathname || '/';
  if (isRaSpikeAppPath(path)) return path;
  if (!STANDALONE) return path;
  if (path === '/' || path === '') return ROUTES.raSpikeHome;
  return `/ra-spike${path.startsWith('/') ? path : `/${path}`}`;
}

/** @param {string} pathname */
export function isRaSpikeStandaloneEntry(pathname) {
  if (isRaSpikeAppPath(pathname)) {
    return pathname === '/ra-spike' || pathname === '/ra-spike/';
  }
  return STANDALONE && (pathname === '/' || pathname === '');
}
