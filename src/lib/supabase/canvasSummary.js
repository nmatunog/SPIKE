import { supabase } from '../../supabaseClient.js';

/** @param {string} userId */
export async function fetchCanvasSummary(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('canvas_summary')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>} patch
 */
export async function upsertCanvasSummary(userId, patch) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('canvas_summary')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
