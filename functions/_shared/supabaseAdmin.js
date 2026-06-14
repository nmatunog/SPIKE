import { createClient } from '@supabase/supabase-js';

/** @param {Record<string, string>} env */
export function getSupabaseUrl(env) {
  const raw = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  return raw.replace(/\/(rest|auth|storage)\/v1\/?$/i, '');
}

/** @param {Record<string, string>} env */
export function createServiceClient(env) {
  const url = getSupabaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL must be configured.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** @param {Record<string, string>} env @param {string | null} authHeader */
export function createUserClient(env, authHeader) {
  const url = getSupabaseUrl(env);
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!url || !anon || !token) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
