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

/**
 * Default Playbook day for an intern (Week 1) — cohort calendar day, not gated by prior completion.
 * @param {object | null | undefined} internProgress
 */
export function resolveInternPlaybookDay(internProgress) {
  const week = internProgress?.current_week ?? 1;
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
