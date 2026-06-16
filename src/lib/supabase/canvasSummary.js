import { supabase } from '../../supabaseClient.js';
import { isInvalidUuidError, isMissingSchemaError, shouldSkipSupabaseUserWrite, canWriteParticipantRow } from './writeGuards.js';
import { toLegacyCanvasSummaryPatch } from './canvasSummaryFields.js';

/** When production DB has not run 20260713_fec_canvas_v2.sql yet. */
let canvasSummarySupportsV2 = null;

/** @param {string} userId */
export async function fetchCanvasSummary(userId) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return null;
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
  if (!supabase || !(await canWriteParticipantRow(userId))) return null;

  const write = async (payload) =>
    supabase
      .from('canvas_summary')
      .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' })
      .select()
      .single();

  try {
    const payload =
      canvasSummarySupportsV2 === false ? toLegacyCanvasSummaryPatch(patch) : patch;
    let { data, error } = await write(payload);

    if (error && canvasSummarySupportsV2 !== false && isMissingSchemaError(error)) {
      canvasSummarySupportsV2 = false;
      ({ data, error } = await write(toLegacyCanvasSummaryPatch(patch)));
    } else if (!error && canvasSummarySupportsV2 === null) {
      canvasSummarySupportsV2 = true;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    if (isInvalidUuidError(err) || isMissingSchemaError(err)) return null;
    console.warn('[canvasSummary] upsert failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
