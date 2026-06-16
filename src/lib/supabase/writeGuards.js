import { isMockUserId } from '../mockAuth.js';

/** Skip Supabase reads/writes for demo / superuser preview participant ids. */
export function shouldSkipSupabaseUserWrite(userId) {
  return !userId || isMockUserId(userId);
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
