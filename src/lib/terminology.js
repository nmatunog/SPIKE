/** User-facing labels — internal role key remains `faculty`. */

export const PROGRAM_COACH_LABEL = 'Program Coach';
export const PROGRAM_COACH_LABEL_PLURAL = 'Program Coaches';

/** Database role → staff-directory label */
export const DB_ROLE_LABELS = {
  INTERN: 'Intern',
  FACULTY: PROGRAM_COACH_LABEL,
  MENTOR: 'Advisor (Mentor)',
  ADMIN: 'Administrator',
  SUPERUSER: 'Superuser',
};

/** @param {string} [dbRole] */
export function formatDbRoleLabel(dbRole) {
  return DB_ROLE_LABELS[dbRole] ?? dbRole ?? 'Unknown';
}

/** @param {string} [userRole] */
export function formatUiRoleLabel(userRole) {
  switch (userRole) {
    case 'profile_error':
      return 'Profile pending';
    case 'intern':
      return 'Intern';
    case 'faculty':
      return PROGRAM_COACH_LABEL;
    case 'mentor':
      return 'Advisor';
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
  if (audience === 'mentor') return 'Mentor';
  return String(audience ?? PROGRAM_COACH_LABEL);
}
