import { supabase } from '../../supabaseClient.js';

/** @param {string} userId */
export async function fetchDay1BuilderProgress(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('day1_builder_progress')
    .select('builder_id, completed_at, payload')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 * @param {string} builderId
 * @param {Record<string, unknown>} entry
 */
export async function upsertDay1BuilderProgress(userId, builderId, entry) {
  if (!supabase || !userId || !builderId) return null;
  const completedAt = entry.completedAt ? String(entry.completedAt) : new Date().toISOString();
  const { data, error } = await supabase
    .from('day1_builder_progress')
    .upsert(
      {
        user_id: userId,
        builder_id: builderId,
        completed_at: completedAt,
        payload: {
          ...entry,
          data: entry.data ?? {},
          updatedAt: new Date().toISOString(),
        },
      },
      { onConflict: 'user_id,builder_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Best-effort upsert for backfill — does not throw. */
export async function upsertDay1BuilderProgressSoft(userId, builderId, entry) {
  try {
    return await upsertDay1BuilderProgress(userId, builderId, entry);
  } catch (err) {
    console.warn('[day1BuilderProgress] upsert failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
