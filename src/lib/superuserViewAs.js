/** Superuser portal preview — session-only; does not change DB role. */

import { MENTOR_LABEL } from './terminology.js';

export const VIEW_AS_STORAGE_KEY = 'spike_superuser_view_as';

/** @type {{ id: string; label: string }[]} */
export const VIEW_AS_ROLE_OPTIONS = [
  { id: 'intern', label: 'Intern' },
  { id: 'faculty', label: 'Program Coach' },
  { id: 'mentor', label: MENTOR_LABEL },
  { id: 'admin', label: 'Admin' },
];

const VIEW_AS_IDS = new Set(VIEW_AS_ROLE_OPTIONS.map((o) => o.id));

/** @returns {string | null} */
export function readViewAsRole() {
  try {
    const value = sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
    return value && VIEW_AS_IDS.has(value) ? value : null;
  } catch {
    return null;
  }
}

/** @param {string | null | undefined} role */
export function writeViewAsRole(role) {
  try {
    if (role && VIEW_AS_IDS.has(role)) {
      sessionStorage.setItem(VIEW_AS_STORAGE_KEY, role);
    } else {
      sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string} actualRole
 * @param {string | null | undefined} viewAsRole
 */
export function getEffectiveUserRole(actualRole, viewAsRole) {
  if (actualRole !== 'superuser') return actualRole;
  if (!viewAsRole || !VIEW_AS_IDS.has(viewAsRole)) return 'superuser';
  return viewAsRole;
}

/** Superuser sessions use full portal access regardless of view-as preview. */
export function isSuperuserPortalSession(actualRole) {
  return actualRole === 'superuser';
}

export function getPortalAccessRole(actualRole) {
  return actualRole === 'superuser' ? 'superuser' : actualRole;
}

/**
 * Role for module nav — superuser uses a slim ops menu unless previewing another role.
 * @param {string} actualRole
 * @param {string | null | undefined} viewAsRole
 */
export function moduleNavRoleForUser(actualRole, viewAsRole) {
  if (actualRole !== 'superuser') return actualRole;
  if (viewAsRole && VIEW_AS_IDS.has(viewAsRole)) return viewAsRole;
  return 'superuser';
}
