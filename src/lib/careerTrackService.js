/**
 * Career track selection — agency_builder | specialist_consultant (Sprint 05).
 */
import { supabase } from '../supabaseClient.js';

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
 * @param {string} userId
 * @param {object | null | undefined} internProgress
 */
export function needsCareerTrackSelection(userId, internProgress) {
  if (!userId || !internProgress) return false;
  if (internProgress.career_track_selected_at) return false;
  return !readConfirmed()[userId];
}

/**
 * @param {string} userId
 * @param {'agency_builder' | 'specialist_consultant'} track
 */
export async function saveCareerTrackSelection(userId, track) {
  if (!userId || !supabase) return null;

  const { data, error } = await supabase
    .from('intern_progress')
    .update({
      career_track: track,
      career_track_selected_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('career_track, career_track_selected_at, segment, hours, licensed, squad, university, current_week, current_day')
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
