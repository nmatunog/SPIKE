/**
 * Dream board images sync per-card to Supabase (avoids oversized day1_builder_progress JSON).
 */
import { readBuilderEntry, writeBuilderEntry } from './day1BuilderStorage.js';
import { fetchDreamBoardAssets, syncDreamBoardAssets } from './supabase/dreamBoardAssets.js';

/**
 * @param {Record<string, unknown>} data
 */
export function dreamBoardMetadataForCloud(data) {
  const assets = /** @type {Array<Record<string, unknown>>} */ (data?.assets ?? []);
  return {
    ...data,
    assets: assets.map((asset) => ({
      id: asset.id,
      category: asset.category,
      caption: asset.caption,
    })),
  };
}

/**
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} localAssets
 * @param {Awaited<ReturnType<typeof fetchDreamBoardAssets>>} cloudRows
 */
export function mergeDreamBoardAssetLists(localAssets, cloudRows) {
  const imageByClientId = new Map(
    cloudRows
      .filter((row) => row.client_asset_id && row.image_url)
      .map((row) => [String(row.client_asset_id), String(row.image_url)]),
  );

  if (localAssets.length) {
    return localAssets.map((asset) => ({
      ...asset,
      imageUrl: asset.imageUrl || imageByClientId.get(asset.id) || '',
    }));
  }

  return cloudRows
    .filter((row) => row.client_asset_id)
    .map((row) => ({
      id: String(row.client_asset_id),
      category: row.category,
      caption: row.caption ?? '',
      imageUrl: row.image_url ?? '',
    }));
}

/** @param {string} participantId @param {Record<string, unknown>} data */
export async function syncDreamBoardToCloud(participantId, data) {
  const assets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    data?.assets ?? []
  );
  await syncDreamBoardAssets(participantId, assets);
}

/**
 * Merge cloud dream board images into local builder storage.
 * @param {string} participantId
 * @param {{ preferLocalImages?: boolean }} [opts]
 */
export async function hydrateDreamBoardImagesFromCloud(participantId, opts = {}) {
  const cloudRows = await fetchDreamBoardAssets(participantId);
  if (!cloudRows.length) return false;

  const entry = readBuilderEntry(participantId, 'dream-board');
  const localAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    entry?.data?.assets ?? []
  );

  let merged;
  if (opts.preferLocalImages && localAssets.some((asset) => asset.imageUrl)) {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
    merged = merged.map((asset) => {
      const local = localAssets.find((item) => item.id === asset.id);
      return local?.imageUrl ? { ...asset, imageUrl: local.imageUrl } : asset;
    });
  } else {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
  }

  if (!merged.length && !localAssets.length) return false;

  const nextData = {
    ...(entry?.data ?? {}),
    assets: merged.length ? merged : localAssets,
  };

  writeBuilderEntry(participantId, 'dream-board', nextData, Boolean(entry?.completedAt), {
    force: true,
    refining: entry?.refining,
  });

  return true;
}
