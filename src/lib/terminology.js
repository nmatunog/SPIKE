/** User-facing labels — internal role key remains `faculty`. */

export const PROGRAM_COACH_LABEL = 'Program Coach';
export const PROGRAM_COACH_LABEL_PLURAL = 'Program Coaches';
export const MENTOR_LABEL = 'Mentor';
export const MENTOR_LABEL_PLURAL = 'Mentors';

/** Database role → staff-directory label */
export const DB_ROLE_LABELS = {
  INTERN: 'Intern',
  FACULTY: PROGRAM_COACH_LABEL,
  MENTOR: MENTOR_LABEL,
  ADMIN: 'Administrator',
  SUPERUSER: 'Superuser',
};

/** Portal role picker options (value stays DB enum; label is user-facing). */
export const PORTAL_DB_ROLE_OPTIONS = [
  { value: 'INTERN', label: 'Intern' },
  { value: 'FACULTY', label: PROGRAM_COACH_LABEL },
  { value: 'MENTOR', label: MENTOR_LABEL },
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'SUPERUSER', label: 'Superuser' },
];

/** @param {string[]} allowedValues */
export function portalRoleOptionsFor(allowedValues) {
  const allowed = new Set(allowedValues);
  return PORTAL_DB_ROLE_OPTIONS.filter((opt) => allowed.has(opt.value));
}

/** @param {string} [dbRole] */
export function formatDbRoleLabel(dbRole) {
  return DB_ROLE_LABELS[dbRole] ?? dbRole ?? 'Unknown';
}

/** RA-SPIKE participant label (DB role remains INTERN). */
export const ROOKIE_LABEL = 'Rookie';
export const ROOKIE_LABEL_PLURAL = 'Rookies';

/**
 * @param {string} [userRole]
 * @param {{ raSpikeApp?: boolean }} [options]
 */
export function formatUiRoleLabel(userRole, options = {}) {
  switch (userRole) {
    case 'profile_error':
      return 'Profile pending';
    case 'intern':
      return options.raSpikeApp ? ROOKIE_LABEL : 'Intern';
    case 'faculty':
      return PROGRAM_COACH_LABEL;
    case 'mentor':
      return MENTOR_LABEL;
    case 'admin':
      return 'Admin';
    case 'superuser':
      return 'Superuser';
    default:
      return 'Guest';
  }
}

/** @param {string} [audience] */
export function formatPlaybookAudience(audience) {
  if (audience === 'faculty') return PROGRAM_COACH_LABEL;
  if (audience === 'mentor') return MENTOR_LABEL;
  return String(audience ?? PROGRAM_COACH_LABEL);
}
