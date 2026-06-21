/**
 * Simplified squad/day ratings for mentors and faculty — scores over essays.
 */
const STORAGE_KEY = 'spike_squad_ratings_v1';

/** @typedef {{ overallScore: number, standoutParticipantId?: string, standoutNote?: string, coachXp?: number, savedAt: string, ratedBy: string }} SquadDayRating */

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} staffId @param {string} squadName @param {number} week @param {number} day */
function ratingKey(staffId, squadName, week, day) {
  return `${staffId}:${squadName}:w${week}:d${day}`;
}

/**
 * @param {string} staffId
 * @param {string} squadName
 * @param {number} week
 * @param {number} day
 * @returns {SquadDayRating | null}
 */
export function getSquadDayRating(staffId, squadName, week, day) {
  const key = ratingKey(staffId, squadName, week, day);
  return readAll()[key] ?? null;
}

/**
 * @param {string} staffId
 * @param {string} squadName
 * @param {number} week
 * @param {number} day
 * @param {{ overallScore: number, standoutParticipantId?: string, standoutNote?: string, role?: string }} input
 */
export function saveSquadDayRating(staffId, squadName, week, day, input) {
  const key = ratingKey(staffId, squadName, week, day);
  const all = readAll();
  const prevCount = Object.keys(all).filter((k) => k.startsWith(`${staffId}:`)).length;
  const rating = {
    overallScore: Math.min(5, Math.max(1, Number(input.overallScore) || 0)),
    standoutParticipantId: input.standoutParticipantId || undefined,
    standoutNote: String(input.standoutNote ?? '').trim().slice(0, 280) || undefined,
    coachXp: 10 + (input.overallScore >= 4 ? 5 : 0),
    savedAt: new Date().toISOString(),
    ratedBy: staffId,
    role: input.role ?? 'mentor',
  };
  all[key] = rating;
  writeAll(all);
  return { rating, streak: prevCount + 1, totalXp: (prevCount + 1) * 10 };
}

/** @param {string} staffId */
export function getCoachRatingGamification(staffId) {
  const all = readAll();
  const mine = Object.entries(all).filter(([k]) => k.startsWith(`${staffId}:`));
  const totalXp = mine.reduce((sum, [, r]) => sum + (r.coachXp ?? 10), 0);
  const streak = mine.length;
  let level = 'Rookie Coach';
  if (streak >= 15) level = 'Master Coach';
  else if (streak >= 8) level = 'Veteran Coach';
  else if (streak >= 3) level = 'Active Coach';
  return { totalXp, streak, level };
}

export const SIMPLIFIED_PULSE_LABEL = 'Squad pulse today';
export const SIMPLIFIED_PULSE_HINTS = ['Struggling', 'Building', 'Solid', 'Strong', 'Standout'];
