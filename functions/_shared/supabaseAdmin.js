import { createClient } from '@supabase/supabase-js';

const SPIKE_INTERNSHIP_PROJECT_REF = 'lzbfjbtjropoaynbcxew';
const RA_SPIKE_PROJECT_REF = 'yruwfdjqigxxwbqsqhho';

/** @param {string} url @param {string} expectedRef @param {string} label */
function assertSupabaseProjectRef(url, expectedRef, label) {
  if (!url) return;
  if (!url.includes(expectedRef)) {
    throw new Error(
      `${label} Supabase URL must use project ${expectedRef}. Rookies (RA-SPIKE) and interns (SPIKE) use separate databases.`,
    );
  }
}

/** @param {Record<string, string>} env */
export function getSupabaseUrl(env) {
  const raw = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  return raw.replace(/\/(rest|auth|storage)\/v1\/?$/i, '');
}

/** RA-SPIKE™ uses a separate Supabase project from SPIKE Internship. */
export function getRaSpikeSupabaseUrl(env) {
  const raw =
    env.RA_SPIKE_SUPABASE_URL ||
    env.VITE_RA_SPIKE_SUPABASE_URL ||
    '';
  return raw.replace(/\/(rest|auth|storage)\/v1\/?$/i, '');
}

/** @param {Record<string, string>} env */
export function createServiceClient(env) {
  const url = getSupabaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL must be configured.');
  }
  if (url.includes(RA_SPIKE_PROJECT_REF)) {
    throw new Error('SPIKE Internship APIs must not use the RA-SPIKE database.');
  }
  assertSupabaseProjectRef(url, SPIKE_INTERNSHIP_PROJECT_REF, 'SPIKE Internship');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** @param {Record<string, string>} env */
export function createRaSpikeServiceClient(env) {
  const url = getRaSpikeSupabaseUrl(env);
  const key = env.RA_SPIKE_SERVICE_ROLE_KEY || env.RA_SPIKE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('RA_SPIKE_SERVICE_ROLE_KEY and RA_SPIKE_SUPABASE_URL must be configured.');
  }
  if (url.includes(SPIKE_INTERNSHIP_PROJECT_REF)) {
    throw new Error('RA-SPIKE APIs must not use the SPIKE Internship database.');
  }
  assertSupabaseProjectRef(url, RA_SPIKE_PROJECT_REF, 'RA-SPIKE');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** @param {Record<string, string>} env @param {string | null} authHeader */
export function createRaSpikeUserClient(env, authHeader) {
  const url = getRaSpikeSupabaseUrl(env);
  const anon = env.VITE_RA_SPIKE_SUPABASE_ANON_KEY || env.RA_SPIKE_SUPABASE_ANON_KEY;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!url || !anon || !token) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
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
