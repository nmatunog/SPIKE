/**
 * RA-SPIKE API client — routes RA auth/signup/admin to the RA-SPIKE Pages project via /ra-spike/api.
 * SPIKE Internship admin APIs stay on portal /api (main Pages project).
 */
import { apiFetch } from '../apiClient.js';
import { isRaSpikeAppPath } from '../routes/paths.js';

const RA_PREFIX = (import.meta.env.VITE_RA_SPIKE_API_PREFIX || '/ra-spike/api').replace(/\/$/, '');

/**
 * True only inside the RA-SPIKE app bundle or /ra-spike/* URLs on the shared portal host.
 * Do not infer from RA_PREFIX alone — the internship bundle also defaults to /ra-spike/api for proxy calls.
 */
export function isRaSpikePortalContext() {
  if (import.meta.env.VITE_RA_SPIKE_STANDALONE === 'true') return true;
  if (typeof window !== 'undefined') {
    return isRaSpikeAppPath(window.location.pathname);
  }
  return false;
}

/** @param {string} path Must start with / (e.g. /ra-spike/signup) */
export function raSpikeApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${RA_PREFIX}${normalized}`;
}

/** @param {string} path @param {Parameters<typeof apiFetch>[1]} [opts] */
export function raSpikeApiFetch(path, opts = {}) {
  return apiFetch(raSpikeApiUrl(path), opts);
}
