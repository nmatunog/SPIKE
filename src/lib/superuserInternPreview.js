import {
  ensureSuperuserInternPreviewSeeded,
  readSuperuserInternPreviewProgressPatch,
  SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
  SUPERUSER_INTERN_PREVIEW_PROGRESS,
} from './superuserInternPreviewData.js';
import { resolveStaffProgramDay } from './programCalendar.js';
import { UNLOCK_WEEK2, UNLOCK_WEEK3, UNLOCK_WEEK4, UNLOCK_WEEK5 } from './programUnlocks.js';

const SAMPLE_INTERN_NAME = 'Alex Rivera (Sample)';

/** Wall-clock cohort day for superuser intern preview (no manual inputs). */
export function resolveSuperuserInternCalendarDay(cohortStartDate = null) {
  return resolveStaffProgramDay(cohortStartDate);
}

/** @param {string | null | undefined} [cohortStartDate] */
export function buildSuperuserInternPreviewProgress(cohortStartDate = null) {
  const calendar = resolveSuperuserInternCalendarDay(cohortStartDate);
  const merged = {
    ...SUPERUSER_INTERN_PREVIEW_PROGRESS,
    ...readSuperuserInternPreviewProgressPatch(),
  };
  const segment = merged.segment ?? 1;
  if (segment !== 1) {
    return { ...merged, current_week: calendar.week, current_day: calendar.day };
  }

  let week = calendar.week;
  if (UNLOCK_WEEK5) week = Math.max(week, 5);
  else if (UNLOCK_WEEK4) week = Math.max(week, 4);
  else if (UNLOCK_WEEK3) week = Math.max(week, 3);
  else if (UNLOCK_WEEK2) week = Math.max(week, 2);

  return {
    ...merged,
    current_week: week,
    current_day: calendar.day,
  };
}

/**
 * Build a preview user for superuser "view as intern" mode.
 * Uses mock local portfolio data — does not modify Supabase.
 *
 * @param {object | null | undefined} user
 * @param {string} actualRole
 * @param {string | null | undefined} viewAsRole
 */
export function buildSuperuserInternPreviewUser(user, actualRole, viewAsRole) {
  if (actualRole !== 'superuser' || viewAsRole !== 'intern' || !user) return user;

  ensureSuperuserInternPreviewSeeded();

  return {
    ...user,
    id: SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
    name: SAMPLE_INTERN_NAME,
    email: user.email,
    internProgress: buildSuperuserInternPreviewProgress(),
    isSuperuserInternPreview: true,
  };
}

/**
 * Intern route user for superuser — always sample data on intern-only pages.
 * @param {object | null | undefined} user
 * @param {string} actualRole
 */
export function resolveSuperuserInternRouteUser(user, actualRole) {
  return buildSuperuserInternPreviewUser(user, actualRole, 'intern');
}

/** @param {object | null | undefined} user */
export function isSuperuserInternPreviewUser(user) {
  return Boolean(user?.isSuperuserInternPreview);
}
