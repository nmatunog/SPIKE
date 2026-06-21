/**
 * Week 2 login welcome — certificate first, then Activate hero (once per participant).
 */
import { UNLOCK_WEEK2, resolveInternProgramWeek } from './programUnlocks.js';

const SEEN_KEY = 'spike_week2_login_welcome_seen_v1';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function hasSeenWeek2LoginWelcome(participantId) {
  if (!participantId) return true;
  return Boolean(readAll()[participantId]?.seenAt);
}

/** @param {string} participantId */
export function markWeek2LoginWelcomeSeen(participantId) {
  if (!participantId) return;
  const all = readAll();
  all[participantId] = { seenAt: new Date().toISOString() };
  writeAll(all);
}

/**
 * @param {string} participantId
 * @param {object | null | undefined} internProgress
 */
export function shouldShowWeek2LoginWelcome(participantId, internProgress) {
  if (!UNLOCK_WEEK2 || !participantId) return false;
  if (hasSeenWeek2LoginWelcome(participantId)) return false;
  return resolveInternProgramWeek(internProgress) >= 2;
}
