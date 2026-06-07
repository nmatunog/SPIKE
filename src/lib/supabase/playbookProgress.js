import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {'worksheet' | 'activity' | 'reflection' | 'assessment'} itemType
 * @param {string} itemId
 * @param {string} [dayId]
 * @param {Record<string, unknown>} [payload]
 */
export async function upsertPlaybookCompletion(userId, itemType, itemId, dayId, payload = {}) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { error } = await supabase.from('playbook_completions').upsert(
    {
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      day_id: dayId ?? null,
      payload,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,item_type,item_id' },
  );

  if (error) {
    console.warn('[playbookProgress] upsert failed:', error.message);
    return null;
  }

  return true;
}

/**
 * @param {string} userId
 * @param {string} [dayId]
 */
export async function fetchPlaybookCompletions(userId, dayId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  let query = supabase
    .from('playbook_completions')
    .select('item_type, item_id, day_id, payload, completed_at')
    .eq('user_id', userId);

  if (dayId) query = query.eq('day_id', dayId);

  const { data, error } = await query;
  if (error) {
    console.warn('[playbookProgress] fetch failed:', error.message);
    return null;
  }

  return data ?? [];
}
