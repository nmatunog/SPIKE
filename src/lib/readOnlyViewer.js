/**
 * Temporary read-only admin viewer (Admin01) — full portal navigation, no mutations.
 */

/** Supabase Auth email for the Admin01 viewer account. */
export const ADMIN_VIEWER_EMAIL = 'admin01@viewer.1cma.online';

/** @param {{ role?: string, email?: string, read_only?: boolean } | null | undefined} profile */
export function isReadOnlyViewerProfile(profile) {
  if (!profile || profile.role !== 'ADMIN') return false;
  if (profile.read_only) return true;
  return String(profile.email ?? '').trim().toLowerCase() === ADMIN_VIEWER_EMAIL;
}

const VIEWER_LOGIN_ALIASES = new Set(['admin01']);

/**
 * Map username-style login (Admin01) to the viewer email.
 * @param {string} identifier
 */
export function normalizeLoginIdentifier(identifier) {
  const raw = String(identifier ?? '').trim();
  if (!raw) return raw;
  const key = raw.toLowerCase();
  if (VIEWER_LOGIN_ALIASES.has(key)) return ADMIN_VIEWER_EMAIL;
  if (!raw.includes('@') && VIEWER_LOGIN_ALIASES.has(key.replace(/\s+/g, ''))) {
    return ADMIN_VIEWER_EMAIL;
  }
  return raw;
}

/** @param {object | null | undefined} user */
export function isReadOnlyViewerUser(user) {
  return Boolean(user?.readOnlyViewer);
}

/**
 * Block portal mutations for read-only viewer accounts.
 * @param {object | null | undefined} user
 */
export function assertPortalCanWriteUser(user) {
  if (isReadOnlyViewerUser(user)) {
    throw new Error('This account is view-only. You can browse the portal but cannot make changes.');
  }
}
