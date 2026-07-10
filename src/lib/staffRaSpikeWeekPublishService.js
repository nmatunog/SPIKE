import { assertPortalCanWrite } from './portalWriteAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud sync is not configured.');
  }
  return supabase;
}

/**
 * @param {number} week
 * @param {number | null} [cohortId]
 * @returns {Promise<{ week: number, updated_count: number, cohort_id?: number | null, published_at?: string }>}
 */
export async function staffPublishRaSpikeWeek(week, cohortId = null) {
  await assertPortalCanWrite();
  const client = assertClient();
  const { data, error } = await client.rpc('publish_ra_spike_week', {
    p_week: week,
    p_cohort_id: cohortId,
  });
  if (error) throw new Error(error.message);
  return data ?? { week, updated_count: 0 };
}

/**
 * @param {number | null} [cohortId]
 * @returns {Promise<{ total: number, minWeek: number, maxWeek: number, atWeek: Record<number, number> }>}
 */
export async function fetchRaSpikeWeekPublishStats(cohortId = null) {
  const client = assertClient();
  let query = client
    .from('intern_progress')
    .select('ra_spike_current_week')
    .eq('program_slug', 'ra-spike');
  if (cohortId != null) {
    query = query.eq('cohort_id', cohortId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  /** @type {Record<number, number>} */
  const atWeek = {};
  let minWeek = 8;
  let maxWeek = 1;
  for (const row of data ?? []) {
    const w = Math.max(1, Math.min(8, Number(row.ra_spike_current_week) || 1));
    atWeek[w] = (atWeek[w] ?? 0) + 1;
    minWeek = Math.min(minWeek, w);
    maxWeek = Math.max(maxWeek, w);
  }
  if (!data?.length) {
    minWeek = 1;
    maxWeek = 1;
  }
  return { total: data?.length ?? 0, minWeek, maxWeek, atWeek };
}
