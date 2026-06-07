/**
 * Career track selection — agency_builder | specialist_consultant (Sprint 05).
 * Interns explore shared curriculum in Week 1; track choice gates from Week 2 onward.
 */
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { deriveWeekDay } from './sprint01Metrics.js';
import {
  isMockUserId,
  shouldUseSupabaseForUser,
  updateMockInternProgress,
} from './mockAuth.js';

/** First week is orientation — track decision opens entering Week 2. */
export const CAREER_TRACK_SELECTION_MIN_WEEK = 2;

const STORAGE_KEY = 'spike_career_track_confirmed';

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

/**
 * @param {object | null | undefined} internProgress
 */
export function getProgramWeek(internProgress) {
  if (!internProgress) return 1;
  if (internProgress.current_week != null) {
    return Math.max(1, Number(internProgress.current_week));
  }
  return deriveWeekDay(internProgress.hours ?? 0).currentWeek;
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

  if (isMockUserId(userId) || !shouldUseSupabaseForUser({ id: userId, isMockUser: isMockUserId(userId) })) {
    const progress = updateMockInternProgress(userId, {
      ...(existingProgress ?? {}),
      ...progressPatch,
    });
    if (!progress) {
      throw new Error('Demo session expired. Sign in again with john@example.com.');
    }
    const confirmed = readConfirmed();
    confirmed[userId] = true;
    writeConfirmed(confirmed);
    return progress;
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('intern_progress')
    .update(progressPatch)
    .eq('user_id', userId)
    .select(
      'career_track, career_track_selected_at, segment, hours, licensed, squad, university, current_week, current_day',
    )
    .single();

  if (error) throw error;

  const confirmed = readConfirmed();
  confirmed[userId] = true;
  writeConfirmed(confirmed);

  return data;
}

/** @param {string} userId */
export function markCareerTrackConfirmedLocal(userId) {
  const confirmed = readConfirmed();
  confirmed[userId] = true;
  writeConfirmed(confirmed);
}
