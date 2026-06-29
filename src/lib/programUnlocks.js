/**
 * Cohort pilot gates — open progression without day-to-day completion prerequisites.
 * Does not delete or overwrite participant data.
 */
import { deriveWeekDay } from './sprint01Metrics.js';
import { applyStageUnlockToParticipant } from './stageGateParticipantStorage.js';

/**
 * When true, interns may use any Week 1 Playbook day and portfolio work without finishing
 * prior days. Yesterday's outputs are never required for today's Playbook or Portfolio.
 */
export const UNLOCK_WEEK1_DAY2_PLUS = true;

/** When true, Segment 1 interns enter Week 2 (Activate) on login — stage gate Week 1 treated complete. */
export const UNLOCK_WEEK2 = true;

/** When true, Segment 1 interns may access Week 3 (Business Operations / Advise). */
export const UNLOCK_WEEK3 = true;

/**
 * Effective program week for interns (cohort pilot may advance ahead of stored progress).
 * @param {object | null | undefined} internProgress
 */
export function resolveInternProgramWeek(internProgress) {
  const segment = internProgress?.segment ?? 1;
  const stored = internProgress?.current_week ?? 1;
  if (UNLOCK_WEEK3 && segment === 1) {
    return Math.max(stored, 3);
  }
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
  const segment = internProgress?.segment ?? 1;
  const week = resolveInternProgramWeek(internProgress);
  const hours = internProgress?.hours ?? 0;
  const derived = deriveWeekDay(hours);
  const storedWeek = internProgress?.current_week ?? 1;
  let day = internProgress?.current_day ?? derived.currentDay;

  // Week 2 pilot unlock — stored progress may still reflect Week 1 calendar; playbook starts Day 1.
  if (UNLOCK_WEEK2 && segment === 1 && week >= 2 && storedWeek < 2) {
    return 1;
  }

  // Week 3 — playbook starts at Day 1 when cohort advances ahead of stored progress.
  if (UNLOCK_WEEK3 && segment === 1 && week >= 3 && storedWeek < 3) {
    return 1;
  }

  return Math.max(1, Math.min(5, day));
}

/** @param {number} week @param {number} segment @param {number} [day] */
export function isPlaybookDayUnlocked(week, segment, day = 1) {
  if (segment !== 1 || week > 1) return true;
  if (UNLOCK_WEEK1_DAY2_PLUS) return day >= 1 && day <= 5;
  return day >= 1 && day <= 5;
}

/** @param {object | null | undefined} internProgress */
export function isSegment1Week2Open(internProgress) {
  return UNLOCK_WEEK2 && (internProgress?.segment ?? 1) === 1;
}

/**
 * Local unlock — Week 2 open for all; no Week 1 submission or ceremony required.
 * @param {string} participantId
 */
export function ensureWeek2OpenForParticipant(participantId) {
  if (!UNLOCK_WEEK2 || !participantId) return;
  applyStageUnlockToParticipant(participantId, 1, new Date().toISOString().slice(0, 10));
}
