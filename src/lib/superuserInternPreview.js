import {
  ensureSuperuserInternPreviewSeeded,
  readSuperuserInternPreviewProgressPatch,
  SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
  SUPERUSER_INTERN_PREVIEW_PROGRESS,
} from './superuserInternPreviewData.js';
import { resolveStaffProgramDay } from './programCalendar.js';
import { UNLOCK_WEEK2 } from './programUnlocks.js';

const SAMPLE_INTERN_NAME = 'Alex Rivera (Sample)';

/** Wall-clock cohort day for superuser intern preview (no manual inputs). */
export function resolveSuperuserInternCalendarDay(cohortStartDate = null) {
  return resolveStaffProgramDay(cohortStartDate);
}

/** @param {string | null | undefined} [cohortStartDate] */
export function buildSuperuserInternPreviewProgress(cohortStartDate = null) {
  const { week, day } = resolveSuperuserInternCalendarDay(cohortStartDate);
  const merged = {
    ...SUPERUSER_INTERN_PREVIEW_PROGRESS,
    ...readSuperuserInternPreviewProgressPatch(),
  };
  if (UNLOCK_WEEK2 && (merged.segment ?? 1) === 1) {
    return {
      ...merged,
      current_week: 2,
      current_day: 1,
    };
  }
  return {
    ...merged,
    current_week: week,
    current_day: day,
  };
}

/**
 * Build a preview user for superuser "view as intern" mode.
 * Uses mock local portfolio data — does not modify Supabase.
 *
 * @param {object | null | undefined} user
 * @param {string} actualRole
 * @param {string | null | undefined} viewAsRole
 * @param {{ raSpikeApp?: boolean }} [options]
 */
export function buildSuperuserInternPreviewUser(user, actualRole, viewAsRole, options = {}) {
  if (actualRole !== 'superuser' || viewAsRole !== 'intern' || !user) return user;

  // RA-SPIKE participant preview — local Week 1 portfolio only (no internship seed).
  if (options.raSpikeApp) {
    return {
      ...user,
      id: SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
      name: 'RA-SPIKE Sample Rookie',
      email: user.email,
      internProgress: {
        program_slug: 'ra-spike',
        ra_spike_current_week: 1,
        ra_spike_segment: 1,
        onboarding_complete: true,
        cohort_id: null,
      },
      isSuperuserInternPreview: true,
    };
  }

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
 * @param {{ raSpikeApp?: boolean }} [options]
 */
export function resolveSuperuserInternRouteUser(user, actualRole, options = {}) {
  return buildSuperuserInternPreviewUser(user, actualRole, 'intern', options);
}

/** @param {object | null | undefined} user */
export function isSuperuserInternPreviewUser(user) {
  return Boolean(user?.isSuperuserInternPreview);
}
