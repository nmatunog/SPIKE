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
const supabaseUrl = normalizeSupabaseUrl(env.VITE_SUPABASE_URL);
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

