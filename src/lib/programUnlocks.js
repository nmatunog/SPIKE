/**
 * Cohort pilot gates — relax Day 1 completion requirements when enabled.
 * Does not delete or overwrite participant data.
 */
import { deriveWeekDay } from './sprint01Metrics.js';

/** When true, interns may use Week 1 Day 2+ Playbook and portfolio without finishing Day 1. */
export const UNLOCK_WEEK1_DAY2_PLUS = true;

/**
 * Default Playbook day for an intern (Week 1).
 * @param {object | null | undefined} internProgress
 */
export function resolveInternPlaybookDay(internProgress) {
  const week = internProgress?.current_week ?? 1;
  const hours = internProgress?.hours ?? 0;
  const derived = deriveWeekDay(hours);
  const day = internProgress?.current_day ?? derived.currentDay;

  if (UNLOCK_WEEK1_DAY2_PLUS && week <= 1) {
    return Math.max(2, Math.min(5, day));
  }

  return Math.max(1, Math.min(5, day));
}

/** @param {number} week @param {number} segment @param {number} [day] */
export function isPlaybookDayUnlocked(week, segment, day = 1) {
  if (segment !== 1 || week > 1) return true;
  if (UNLOCK_WEEK1_DAY2_PLUS) return day >= 1 && day <= 5;
  return day >= 1 && day <= 5;
}
