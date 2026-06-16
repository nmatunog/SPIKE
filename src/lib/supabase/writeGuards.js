import { isMockUserId } from '../mockAuth.js';
import { supabase } from '../../supabaseClient.js';

/** Skip Supabase reads/writes for demo / superuser preview participant ids. */
export function shouldSkipSupabaseUserWrite(userId) {
  return !userId || isMockUserId(userId);
}

/** Staff browsers may read participant rows but must never upsert them. */
let cachedAuthUserId = null;
let cachedAuthUserIdAt = 0;
const AUTH_USER_CACHE_MS = 10_000;

async function currentAuthUserId() {
  const now = Date.now();
  if (cachedAuthUserId && now - cachedAuthUserIdAt < AUTH_USER_CACHE_MS) {
    return cachedAuthUserId;
  }
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  cachedAuthUserId = session?.user?.id ?? null;
  cachedAuthUserIdAt = now;
  return cachedAuthUserId;
}

/** True only when the signed-in user owns the target participant row. */
export async function canWriteParticipantRow(userId) {
  if (shouldSkipSupabaseUserWrite(userId)) return false;
  const authId = await currentAuthUserId();
  return Boolean(authId && authId === userId);
}

/** @param {{ code?: string; message?: string } | null | undefined} error */
export function isRlsViolationError(error) {
  return error?.code === '42501' || /row-level security/i.test(error?.message || '');
}

/** @param {{ code?: string; message?: string } | null | undefined} error */
export function isMissingSchemaError(error) {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === 'PGRST202' || error.code === '42P01') {
    return true;
  }
  return /schema cache|could not find|not find the/i.test(error.message || '');
}

/** @param {{ code?: string; message?: string } | null | undefined} error */
export function isInvalidUuidError(error) {
  return error?.code === '22P02' || /invalid input syntax for type uuid/i.test(error?.message || '');
}
