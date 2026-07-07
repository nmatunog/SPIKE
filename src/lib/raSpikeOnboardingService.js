/**
 * @param {object | null | undefined} _progress
 */
export function shouldGateRaSpikeOnboarding(_progress) {
  return false;
}

/**
 * @param {string} pathname
 */
export function isRaSpikeOnboardingPath(pathname) {
  return pathname === '/ra-spike/onboarding' || pathname.startsWith('/ra-spike/onboarding/');
}
