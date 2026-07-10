/**
 * RA-SPIKE API client — routes RA auth/signup/admin to the RA-SPIKE Pages project via /ra-spike/api.
 * SPIKE Internship admin APIs stay on portal /api (main Pages project).
 */
import { apiFetch } from '../apiClient.js';

const RA_PREFIX = (import.meta.env.VITE_RA_SPIKE_API_PREFIX || '/ra-spike/api').replace(/\/$/, '');
const RA_SPIKE_PROJECT_REF = 'yruwfdjqigxxwbqsqhho';

/** @returns {boolean} */
export function isRaSpikePortalContext() {
  if (import.meta.env.VITE_RA_SPIKE_STANDALONE === 'true') return true;
  const url = String(import.meta.env.VITE_SUPABASE_URL || '');
  return url.includes(RA_SPIKE_PROJECT_REF);
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
