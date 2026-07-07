/** RA-SPIKE profile photo is optional — never block navigation after sign-in. */
export function shouldGateRaSpikeOnboarding() {
  return false;
}

/**
 * @param {string} pathname
 */
export function isRaSpikeOnboardingPath(pathname) {
  return pathname === '/ra-spike/onboarding' || pathname.startsWith('/ra-spike/onboarding/');
}
