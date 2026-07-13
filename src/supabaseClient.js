import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    // Cloudflare/Supabase dashboards sometimes show Data API paths.
    // Supabase JS client expects the project origin only.
    return `${u.protocol}//${u.host}`;
  } catch {
    return rawUrl.replace(/\/(rest|auth|storage)\/v1\/?$/i, '');
  }
}

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const isRaSpikeStandalone = env.VITE_RA_SPIKE_STANDALONE === 'true';

function spikeInternshipProjectRef() {
  return ['lzbfjbtj', 'ropoaynbcxew'].join('');
}

function raSpikeProjectRef() {
  return ['yruwfd', 'jqigxxwbqsqhho'].join('');
}

function resolveSupabaseUrl() {
  if (isRaSpikeStandalone) {
    return normalizeSupabaseUrl(
      env.VITE_RA_SPIKE_SUPABASE_URL ||
        env.RA_SPIKE_SUPABASE_URL ||
        env.VITE_SUPABASE_URL,
    );
  }
  return normalizeSupabaseUrl(env.VITE_SUPABASE_URL);
}

function resolveSupabaseAnonKey() {
  if (isRaSpikeStandalone) {
    return env.VITE_RA_SPIKE_SUPABASE_ANON_KEY ||
      env.RA_SPIKE_SUPABASE_ANON_KEY ||
      env.VITE_SUPABASE_ANON_KEY;
  }
  return env.VITE_SUPABASE_ANON_KEY;
}

const resolvedSupabaseUrl = resolveSupabaseUrl();
const resolvedSupabaseAnonKey = resolveSupabaseAnonKey();

if (
  isRaSpikeStandalone &&
  resolvedSupabaseUrl &&
  resolvedSupabaseUrl.includes(spikeInternshipProjectRef())
) {
  console.error(
    `RA-SPIKE auth is pointed at the SPIKE Internship Supabase project (${spikeInternshipProjectRef()}). ` +
      `Set VITE_RA_SPIKE_SUPABASE_URL to the RA-SPIKE project (${raSpikeProjectRef()}).`,
  );
}

export const supabaseUrl = resolvedSupabaseUrl;
export const supabaseAnonKey = resolvedSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
