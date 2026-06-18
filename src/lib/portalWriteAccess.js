/**
 * Async portal write guard (requires Supabase session).
 */
import { supabase } from '../supabaseClient.js';
import { isReadOnlyViewerProfile } from './readOnlyViewer.js';

let cachedReadOnly = null;
let cachedReadOnlyAt = 0;
const READ_ONLY_CACHE_MS = 10_000;

/** Block portal mutations for read-only viewer accounts. */
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
    .select('read_only, role, email')
    .eq('id', user.id)
    .maybeSingle();

  const blocked = isReadOnlyViewerProfile(profile);
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
