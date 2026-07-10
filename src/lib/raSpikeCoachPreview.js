import { PROGRAM_SLUGS } from './programs/constants.js';
import { RA_SPIKE_PROGRAM } from './programs/ra-spike.js';

/** @param {object | null | undefined} user */
export function isRaSpikeCoachPreviewUser(user) {
  return Boolean(user?.isRaSpikeCoachPreview);
}

/**
 * Read-only playbook preview for RA-SPIKE coaches — all weeks unlocked, no participant saves.
 * @param {object | null | undefined} user
 */
export function buildRaSpikeCoachPreviewUser(user) {
  if (!user) return user;

  return {
    ...user,
    id: '',
    isRaSpikeCoachPreview: true,
    internProgress: {
      program_slug: PROGRAM_SLUGS.RA_SPIKE,
      ra_spike_current_week: RA_SPIKE_PROGRAM.totalWeeks,
      ra_spike_segment: 2,
      gate_1_status: 'passed',
    },
  };
}

/** @param {string | null | undefined} userRole */
export function isRaSpikeStaffPlaybookRole(userRole) {
  return userRole === 'faculty'
    || userRole === 'mentor'
    || userRole === 'admin'
    || userRole === 'superuser';
}
