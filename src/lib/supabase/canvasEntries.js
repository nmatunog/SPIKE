import { supabase } from '../../supabaseClient.js';
import { isInvalidUuidError, shouldSkipSupabaseUserWrite } from './writeGuards.js';

/** @param {string} userId */
export async function fetchCanvasEntries(userId) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return [];
  const { data, error } = await supabase
    .from('canvas_entries')
    .select('engine_key, field_key, field_value, updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 * @param {string} engineKey
 * @param {string} fieldKey
 * @param {string} fieldValue
 */
export async function upsertCanvasEntry(userId, engineKey, fieldKey, fieldValue) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return null;
  try {
    const { data, error } = await supabase
      .from('canvas_entries')
      .upsert(
        {
          user_id: userId,
          engine_key: engineKey,
          field_key: fieldKey,
          field_value: fieldValue,
        },
        { onConflict: 'user_id,engine_key,field_key' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (isInvalidUuidError(err)) return null;
    console.warn('[canvasEntries] upsert failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
