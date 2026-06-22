import { apiFetch, ApiError } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

/** @param {unknown} err */
export function isInternProgressApiUnavailable(err) {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 503) return true;
  const code = err.data?.code;
  return code === 'MISSING_SERVICE_KEY';
}

/**
 * @param {'ensure' | 'welcome' | 'complete' | 'career_track'} action
 * @param {{ university?: string | null, squad?: string | null, career_track?: 'agency_builder' | 'specialist_consultant' }} [opts]
 */
export async function bootstrapInternProgressViaApi(action = 'ensure', opts = {}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Not signed in. Sign out and sign in with your SPIKE account.');
  }

  const result = await apiFetch('/api/intern/progress', {
    token,
    method: 'POST',
    body: {
      action,
      university: opts.university ?? null,
      squad: opts.squad ?? null,
      career_track: opts.career_track ?? null,
    },
  });

  return result?.progress ?? null;
}
