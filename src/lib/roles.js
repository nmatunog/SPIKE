export function mapApiRoleToUi(role) {
  switch (role) {
    case 'ADMIN':
      return 'admin';
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

export function resolveUserRole(user) {
  if (!user) return 'guest';
  if (user.profileIncomplete) return 'profile_error';
  return mapApiRoleToUi(user.role);
}
