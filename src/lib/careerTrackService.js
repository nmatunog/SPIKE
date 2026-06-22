/**
 * Career track selection — agency_builder | specialist_consultant (Sprint 05).
 * Interns explore shared curriculum in Weeks 1–2; track choice opens in Week 3.
 */
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { resolveInternProgramWeek } from './programUnlocks.js';
import {
  isMockUserId,
  shouldUseSupabaseForUser,
  updateMockInternProgress,
} from './mockAuth.js';
import {
  isSuperuserInternPreviewParticipantId,
  updateSuperuserInternPreviewProgress,
} from './superuserInternPreviewData.js';
import { ensureInternProgress } from './supabase/cohortOnboarding.js';
import {
  bootstrapInternProgressViaApi,
  isInternProgressApiUnavailable,
} from './internProgressApi.js';

/** Track decision deferred to Week 3 so Week 2 Customer Discovery is uninterrupted. */
export const CAREER_TRACK_SELECTION_MIN_WEEK = 3;

const STORAGE_KEY = 'spike_career_track_confirmed';

/** @param {{ code?: string, message?: string }} error */
function isMissingRpcError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return (
    error.code === 'PGRST202'
    || error.code === '42P01'
    || /not find|404|schema cache/i.test(message)
  );
}

/** @param {{ code?: string, message?: string }} error */
function isPermissionDeniedError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return (
    error.code === '42501'
    || error.code === 'PGRST116'
    || /permission|policy|row-level security|0 rows/i.test(message)
  );
}

function readConfirmed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeConfirmed(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function markConfirmed(userId) {
  const confirmed = readConfirmed();
  confirmed[userId] = true;
  writeConfirmed(confirmed);
}

/**
 * @param {object | null | undefined} internProgress
 */
export function getProgramWeek(internProgress) {
  if (!internProgress) return 1;
  return resolveInternProgramWeek(internProgress);
}

/**
 * @param {object | null | undefined} internProgress
 */
export function canPromptCareerTrackSelection(internProgress) {
  return getProgramWeek(internProgress) >= CAREER_TRACK_SELECTION_MIN_WEEK;
}

/**
 * @param {string} userId
 * @param {object | null | undefined} internProgress
 */
export function needsCareerTrackSelection(userId, internProgress) {
  if (!userId || !internProgress) return false;
  if (internProgress.career_track_selected_at) return false;
  if (!canPromptCareerTrackSelection(internProgress)) return false;
  return !readConfirmed()[userId];
}

/**
 * @param {'agency_builder' | 'specialist_consultant'} track
 * @param {object | null | undefined} existingProgress
 */
async function saveCareerTrackViaSupabase(track, existingProgress) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  await ensureInternProgress({
    university: existingProgress?.university ?? null,
    squad: existingProgress?.squad ?? null,
  }).catch(() => null);

  const { data, error } = await supabase.rpc('save_intern_career_track', { p_track: track });
  if (!error && data) return data;

  if (error && !isMissingRpcError(error) && !isPermissionDeniedError(error)) {
    throw error;
  }

  try {
    const progress = await bootstrapInternProgressViaApi('career_track', { career_track: track });
    if (progress?.career_track_selected_at) return progress;
  } catch (apiErr) {
    if (!isInternProgressApiUnavailable(apiErr)) {
      console.warn('[careerTrack] API fallback failed:', apiErr);
    }
  }

  if (error) {
    const message = String(error.message ?? '');
    if (isPermissionDeniedError(error)) {
      throw new Error(
        'Could not save your career track. Ask your Program Coach to apply migration 20260723_intern_career_track_rpc.sql in Supabase.',
      );
    }
    throw new Error(message || 'Could not save career track.');
  }

  throw new Error('Could not save career track. Try again or continue to Week 2 Customer Discovery.');
}

/**
 * @param {string} userId
 * @param {'agency_builder' | 'specialist_consultant'} track
 * @param {object | null | undefined} [existingProgress]
 */
export async function saveCareerTrackSelection(userId, track, existingProgress) {
  if (!userId) return null;

  const now = new Date().toISOString();
  const progressPatch = {
    career_track: track,
    career_track_selected_at: now,
  };

  if (isSuperuserInternPreviewParticipantId(userId)) {
    const progress = updateSuperuserInternPreviewProgress({
      ...(existingProgress ?? {}),
      ...progressPatch,
    });
    markConfirmed(userId);
    return progress;
  }

  if (isMockUserId(userId) || !shouldUseSupabaseForUser({ id: userId, isMockUser: isMockUserId(userId) })) {
    const progress = updateMockInternProgress(userId, {
      ...(existingProgress ?? {}),
      ...progressPatch,
    });
    if (!progress) {
      throw new Error('Session expired. Sign in again with your SPIKE account.');
    }
    markConfirmed(userId);
    return progress;
  }

  const data = await saveCareerTrackViaSupabase(track, existingProgress);
  markConfirmed(userId);
  return data;
}

/** @param {string} userId */
export function markCareerTrackConfirmedLocal(userId) {
  markConfirmed(userId);
}
