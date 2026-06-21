/**
 * Cohort pilot gates — open progression without day-to-day completion prerequisites.
 * Does not delete or overwrite participant data.
 */
import { deriveWeekDay } from './sprint01Metrics.js';

/**
 * When true, interns may use any Week 1 Playbook day and portfolio work without finishing
 * prior days. Yesterday's outputs are never required for today's Playbook or Portfolio.
 */
export const UNLOCK_WEEK1_DAY2_PLUS = true;

/** When true, Segment 1 interns enter Week 2 (Activate) on login — stage gate Week 1 treated complete. */
export const UNLOCK_WEEK2 = true;

/**
 * Effective program week for interns (cohort pilot may advance ahead of stored progress).
 * @param {object | null | undefined} internProgress
 */
export function resolveInternProgramWeek(internProgress) {
  const segment = internProgress?.segment ?? 1;
  const stored = internProgress?.current_week ?? 1;
  if (UNLOCK_WEEK2 && segment === 1) {
    return Math.max(stored, 2);
  }
  return stored;
}

/**
 * Default Playbook day for an intern (Week 1) — cohort calendar day, not gated by prior completion.
 * @param {object | null | undefined} internProgress
 */
export function resolveInternPlaybookDay(internProgress) {
  const week = resolveInternProgramWeek(internProgress);
  const hours = internProgress?.hours ?? 0;
  const derived = deriveWeekDay(hours);
  const day = internProgress?.current_day ?? derived.currentDay;

  if (week <= 1) {
    return Math.max(1, Math.min(5, day));
  }

  return Math.max(1, Math.min(5, day));
}

/** @param {number} week @param {number} segment @param {number} [day] */
export function isPlaybookDayUnlocked(week, segment, day = 1) {
  if (segment !== 1 || week > 1) return true;
  if (UNLOCK_WEEK1_DAY2_PLUS) return day >= 1 && day <= 5;
  return day >= 1 && day <= 5;
}
