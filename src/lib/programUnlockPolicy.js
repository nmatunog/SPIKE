/**
 * Per-program unlock policies — RA-SPIKE uses strict gates; SPIKE Internship keeps pilot flags.
 */
import { isRaSpikeProgram, RA_SPIKE_PROGRAM } from './programs/index.js';
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

/** @param {number} week @param {number} segment @param {number} [day] @param {string} [programSlug] @param {object} [internProgress] */
export function isPlaybookDayUnlocked(week, segment, day = 1, programSlug, internProgress) {
  if (isRaSpikeProgram(programSlug)) {
    if (!isRaSpikeWeekUnlocked(week, internProgress)) return false;
    const currentWeek = internProgress?.ra_spike_current_week ?? week;
    return day >= 1 && day <= 5 && week <= currentWeek;
  }
  return internshipPlaybookDayUnlocked(week, segment, day);
}

/**
 * @param {number} targetWeek
 * @param {object | null | undefined} internProgress
 */
export function isRaSpikeWeekUnlocked(targetWeek, internProgress) {
  const week = Math.max(1, Math.min(8, targetWeek));
  const current = internProgress?.ra_spike_current_week ?? 1;
  if (week > current) return false;
  if (week >= 5) {
    const gate1 = internProgress?.gate_1_status === 'passed';
    const segment = internProgress?.ra_spike_segment ?? 1;
    if (segment < 2 && !gate1) return false;
  }
  return true;
}

/**
 * @param {string} moduleId
 * @param {object | null | undefined} internProgress
 */
export function isRaSpikeModuleAccessible(moduleId, internProgress) {
  if (!isRaSpikeProgram(internProgress?.program_slug)) return false;
  const week = internProgress?.ra_spike_current_week ?? 1;
  const allowed = RA_SPIKE_PROGRAM.weekModuleMap[week] ?? [];
  return allowed.includes(moduleId);
}

/** @param {string | null | undefined} programSlug */
export function shouldBypassInternPilotUnlocks(programSlug) {
  return unlockPolicyForProgram(programSlug) === 'strict';
}

export { UNLOCK_WEEK1_DAY2_PLUS, UNLOCK_WEEK2, UNLOCK_WEEK3 };
