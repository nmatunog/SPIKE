/**
 * Per-program unlock policies — RA-SPIKE uses strict gates; SPIKE Internship keeps pilot flags.
 */
import { isRaSpikeProgram } from './programs/index.js';
import {
  UNLOCK_WEEK1_DAY2_PLUS,
  UNLOCK_WEEK2,
  UNLOCK_WEEK3,
  resolveInternPlaybookDay,
  resolveInternProgramWeek,
  isPlaybookDayUnlocked as internshipPlaybookDayUnlocked,
} from './programUnlocks.js';

/**
 * @param {string | null | undefined} programSlug
 * @returns {'strict' | 'pilot'}
 */
export function unlockPolicyForProgram(programSlug) {
  return isRaSpikeProgram(programSlug) ? 'strict' : 'pilot';
}

/**
 * @param {object | null | undefined} internProgress
 */
export function resolveProgramWeek(internProgress) {
  const programSlug = internProgress?.program_slug;
  if (isRaSpikeProgram(programSlug)) {
    return internProgress?.ra_spike_current_week ?? 1;
  }
  return resolveInternProgramWeek(internProgress);
}

/**
 * @param {object | null | undefined} internProgress
 */
export function resolvePlaybookDay(internProgress) {
  if (isRaSpikeProgram(internProgress?.program_slug)) {
    return 1;
  }
  return resolveInternPlaybookDay(internProgress);
}

/** @param {number} week @param {number} segment @param {number} [day] @param {string} [programSlug] */
export function isPlaybookDayUnlocked(week, segment, day = 1, programSlug) {
  if (isRaSpikeProgram(programSlug)) {
    const currentWeek = week;
    return day >= 1 && day <= 5 && week <= currentWeek;
  }
  return internshipPlaybookDayUnlocked(week, segment, day);
}

/** @param {string | null | undefined} programSlug */
export function shouldBypassInternPilotUnlocks(programSlug) {
  return unlockPolicyForProgram(programSlug) === 'strict';
}

export { UNLOCK_WEEK1_DAY2_PLUS, UNLOCK_WEEK2, UNLOCK_WEEK3 };
