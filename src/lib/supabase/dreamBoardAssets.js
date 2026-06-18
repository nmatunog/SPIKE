import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { shouldSkipSupabaseUserWrite, canWriteParticipantRow, isRlsViolationError } from './writeGuards.js';
import { ensureDreamBoardImageInStorage } from './dreamBoardStorage.js';
import { preferLongerDreamBoardCaption } from '../dreamBoardMerge.js';

/**
 * @typedef {{
 *   id: string,
 *   user_id: string,
 *   client_asset_id: string | null,
 *   category: string,
 *   caption: string,
 *   image_url: string | null,
 *   sort_order: number,
 * }} DreamBoardAssetRow
 */

/** @param {string} userId @param {{ strict?: boolean }} [opts] */
export async function fetchDreamBoardAssets(userId, opts = {}) {
  if (!isSupabaseConfigured || !supabase || shouldSkipSupabaseUserWrite(userId)) return [];

  const { data, error } = await supabase
    .from('dream_board_assets')
    .select('id, user_id, client_asset_id, category, caption, image_url, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[dreamBoardAssets] fetch failed:', error.message);
    if (opts.strict) throw error;
    return [];
  }

  return /** @type {DreamBoardAssetRow[]} */ (data ?? []);
}

/**
 * @param {string} userId
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} assets
 */
export async function syncDreamBoardAssets(userId, assets) {
  if (!isSupabaseConfigured || !supabase || !(await canWriteParticipantRow(userId))) {
    return { ok: false };
  }

  const list = Array.isArray(assets) ? assets : [];
  const keepClientIds = [];
  const existingRows = await fetchDreamBoardAssets(userId);
  const captionByClientId = new Map(
    existingRows
      .filter((row) => row.client_asset_id)
      .map((row) => [String(row.client_asset_id), String(row.caption ?? '')]),
  );

  for (let index = 0; index < list.length; index += 1) {
    const asset = list[index];
    if (!asset?.id) continue;
    // Keep row if it has any content — avoids dropping the last card when caption is still being typed.
    const caption = String(asset.caption ?? '').trim();
    if (!asset.imageUrl && !caption) continue;

    keepClientIds.push(asset.id);

    let imageUrl = asset.imageUrl || null;
    if (imageUrl) {
      imageUrl = await ensureDreamBoardImageInStorage(userId, asset.id, imageUrl);
    }

    const captionToSave = preferLongerDreamBoardCaption(
      asset.caption,
      captionByClientId.get(asset.id),
    );

    const { error } = await supabase.from('dream_board_assets').upsert(
      {
        user_id: userId,
        client_asset_id: asset.id,
        category: asset.category ?? 'lifestyle',
        caption: captionToSave,
        image_url: imageUrl || null,
        sort_order: index,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,client_asset_id' },
    );

    if (error && !isRlsViolationError(error)) {
      console.warn('[dreamBoardAssets] upsert failed:', asset.id, error.message);
    }
  }

  const staleIds = existingRows
    .filter((row) => row.client_asset_id && !keepClientIds.includes(row.client_asset_id))
    .map((row) => row.id);

  if (staleIds.length) {
    const { error } = await supabase.from('dream_board_assets').delete().in('id', staleIds);
    if (error && !isRlsViolationError(error)) {
      console.warn('[dreamBoardAssets] delete stale failed:', error.message);
    }
  }

  return { ok: true, count: keepClientIds.length };
}
