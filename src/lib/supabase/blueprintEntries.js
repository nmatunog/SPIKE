import { supabase } from '../../supabaseClient.js';
import { isInvalidUuidError, shouldSkipSupabaseUserWrite } from './writeGuards.js';

/** @param {string} userId */
export async function fetchBlueprintEntries(userId) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return [];
  const { data, error } = await supabase
    .from('venture_blueprint_entries')
    .select('section_slug, field_key, field_value, source_type, source_id, updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {string} userId
 * @param {string} sectionSlug
 * @param {string} fieldKey
 * @param {string} fieldValue
 * @param {{ sourceType?: string, sourceId?: string }} [meta]
 */
export async function upsertBlueprintEntry(userId, sectionSlug, fieldKey, fieldValue, meta = {}) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return null;
  try {
    const { data, error } = await supabase
      .from('venture_blueprint_entries')
      .upsert(
        {
          user_id: userId,
          section_slug: sectionSlug,
          field_key: fieldKey,
          field_value: fieldValue,
          source_type: meta.sourceType ?? null,
          source_id: meta.sourceId ?? null,
        },
        { onConflict: 'user_id,section_slug,field_key' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (!isInvalidUuidError(err)) {
      console.warn('[blueprintEntries] upsert failed:', err instanceof Error ? err.message : err);
    }
    return null;
  }
}
