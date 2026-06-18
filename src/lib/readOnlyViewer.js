/**
 * Temporary read-only admin viewer (Admin01) — full portal navigation, no mutations.
 */

import { supabase } from '../supabaseClient.js';

/** Supabase Auth email for the Admin01 viewer account. */
export const ADMIN_VIEWER_EMAIL = 'admin01@viewer.1cma.online';

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

let cachedReadOnly = null;
let cachedReadOnlyAt = 0;
const READ_ONLY_CACHE_MS = 10_000;

/** Server-side guard for service modules (cohort admin, codes, user directory). */
export async function assertPortalCanWrite() {
  if (!supabase) return;
  const now = Date.now();
  if (cachedReadOnly !== null && now - cachedReadOnlyAt < READ_ONLY_CACHE_MS) {
    if (cachedReadOnly) {
      throw new Error('This account is view-only. You can browse the portal but cannot make changes.');
    }
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('read_only, role')
    .eq('id', user.id)
    .maybeSingle();

  const blocked = profile?.role === 'ADMIN' && Boolean(profile?.read_only);
  cachedReadOnly = blocked;
  cachedReadOnlyAt = now;

  if (blocked) {
    throw new Error('This account is view-only. You can browse the portal but cannot make changes.');
  }
}

export function clearPortalWriteAccessCache() {
  cachedReadOnly = null;
  cachedReadOnlyAt = 0;
}
