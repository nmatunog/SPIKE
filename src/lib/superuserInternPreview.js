import {
  ensureSuperuserInternPreviewSeeded,
  SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
  SUPERUSER_INTERN_PREVIEW_PROGRESS,
} from './superuserInternPreviewData.js';

const SAMPLE_INTERN_NAME = 'Alex Rivera (Sample)';

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
    internProgress: { ...SUPERUSER_INTERN_PREVIEW_PROGRESS },
    isSuperuserInternPreview: true,
  };
}

/** @param {object | null | undefined} user */
export function isSuperuserInternPreviewUser(user) {
  return Boolean(user?.isSuperuserInternPreview);
}
