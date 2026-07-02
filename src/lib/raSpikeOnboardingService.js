import { isRaSpikeProgram } from './programs/index.js';

/**
 * RA-SPIKE uses a 3-step flow; photo (step 3) sets onboarding_complete.
 * @param {object | null | undefined} progress
 */
export function shouldGateRaSpikeOnboarding(progress) {
  if (!isRaSpikeProgram(progress?.program_slug)) return false;
  return !progress?.onboarding_complete;
}

/**
 * @param {string} pathname
 */
export function isRaSpikeOnboardingPath(pathname) {
  return pathname === '/ra-spike/onboarding' || pathname.startsWith('/ra-spike/onboarding/');
}
