import { isMockUserId, updateMockInternProgress } from './mockAuth.js';
import { isRaSpikeProgram } from './programs/index.js';
import { setOnboardingCompleteCache } from './cohortOnboardingService.js';
import { markOnboardingComplete } from './supabase/cohortOnboarding.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

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

/**
 * Persist onboarding complete for RA-SPIKE rookies (Supabase RPC — works without API JWT).
 * @param {string | null | undefined} userId
 * @param {object | null | undefined} [internProgress]
 */
export async function ensureRaSpikeOnboardingComplete(userId, internProgress) {
  if (!userId) return;
  if (!isRaSpikeProgram(internProgress?.program_slug) && !internProgress?.ra_spike_current_week) {
    return;
  }

  setOnboardingCompleteCache(userId, true);

  if (internProgress?.onboarding_complete) return;

  if (isMockUserId(userId)) {
    updateMockInternProgress(userId, {
      onboarding_complete: true,
      onboarding_welcomed_at: internProgress?.onboarding_welcomed_at ?? new Date().toISOString(),
    });
    return;
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    await markOnboardingComplete(userId);
  } catch {
    const { error } = await supabase.rpc('mark_onboarding_complete');
    if (error) {
      console.warn('[ra-spike] mark_onboarding_complete failed:', error.message);
    }
  }
}
