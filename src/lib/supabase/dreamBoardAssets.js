import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

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

/** @param {string} userId */
export async function fetchDreamBoardAssets(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from('dream_board_assets')
    .select('id, user_id, client_asset_id, category, caption, image_url, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[dreamBoardAssets] fetch failed:', error.message);
    return [];
  }

  return /** @type {DreamBoardAssetRow[]} */ (data ?? []);
}

/**
 * @param {string} userId
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} assets
 */
export async function syncDreamBoardAssets(userId, assets) {
  if (!isSupabaseConfigured || !supabase || !userId) return { ok: false };

  const list = Array.isArray(assets) ? assets : [];
  const keepClientIds = [];

  for (let index = 0; index < list.length; index += 1) {
    const asset = list[index];
    if (!asset?.id) continue;
    if (!asset.imageUrl && !String(asset.caption ?? '').trim()) continue;

    keepClientIds.push(asset.id);

    const { error } = await supabase.from('dream_board_assets').upsert(
      {
        user_id: userId,
        client_asset_id: asset.id,
        category: asset.category ?? 'lifestyle',
        caption: asset.caption ?? '',
        image_url: asset.imageUrl || null,
        sort_order: index,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,client_asset_id' },
    );

    if (error) {
      console.warn('[dreamBoardAssets] upsert failed:', asset.id, error.message);
    }
  }

  const existing = await fetchDreamBoardAssets(userId);
  const staleIds = existing
    .filter((row) => row.client_asset_id && !keepClientIds.includes(row.client_asset_id))
    .map((row) => row.id);

  if (staleIds.length) {
    const { error } = await supabase.from('dream_board_assets').delete().in('id', staleIds);
    if (error) {
      console.warn('[dreamBoardAssets] delete stale failed:', error.message);
    }
  }

  return { ok: true, count: keepClientIds.length };
}
