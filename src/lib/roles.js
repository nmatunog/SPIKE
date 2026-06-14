export function mapApiRoleToUi(role) {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'SUPERUSER':
      return 'superuser';
    case 'INTERN':
      return 'intern';
    case 'FACULTY':
      return 'faculty';
    case 'MENTOR':
      return 'mentor';
    case null:
    case undefined:
      return 'profile_error';
    default:
      return 'guest';
  }
}

export function isAdminLikeRole(userRole) {
  return userRole === 'admin' || userRole === 'superuser';
}

/** @param {string | null | undefined} dbRole */
export function isSuperuserDbRole(dbRole) {
  return dbRole === 'SUPERUSER';
}

export function resolveUserRole(user) {
  if (!user) return 'guest';
  if (user.profileIncomplete) return 'profile_error';
  return mapApiRoleToUi(user.role);
}
