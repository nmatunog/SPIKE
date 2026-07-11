import { PROGRAM_SLUGS } from './programs/constants.js';

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
      ra_spike_current_week: 1,
      ra_spike_segment: 1,
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
