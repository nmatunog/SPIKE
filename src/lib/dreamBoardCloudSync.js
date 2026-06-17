/**
 * Dream board images sync per-card to Supabase (avoids oversized day1_builder_progress JSON).
 */
import { readBuilderEntry, writeBuilderEntry } from './day1BuilderStorage.js';
import { fetchDay1BuilderProgress } from './supabase/day1BuilderProgress.js';
import { fetchDreamBoardAssets, syncDreamBoardAssets } from './supabase/dreamBoardAssets.js';
import { mergeDreamBoardAssetLists, enrichDreamBoardFromMetadata } from './dreamBoardMerge.js';
import { normalizeDreamBoardCards } from './dreamBoardConfig.js';

export { mergeDreamBoardAssetLists, enrichDreamBoardFromMetadata } from './dreamBoardMerge.js';

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

/** Drop inline base64 blobs — staff devices should only keep http(s) image URLs. */
export function stripInlineDreamBoardImage(asset) {
  const imageUrl = String(asset?.imageUrl ?? '');
  if (!imageUrl || imageUrl.startsWith('data:')) {
    return { ...asset, imageUrl: '' };
  }
  return asset;
}

/** @param {string} participantId @param {Record<string, unknown>} data */
export async function syncDreamBoardToCloud(participantId, data) {
  const assets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    data?.assets ?? []
  );
  await syncDreamBoardAssets(participantId, assets);
}

/** Upgrade legacy data-URL rows in dream_board_assets to Supabase Storage http URLs. */
export async function upgradeDreamBoardInlineCloudImages(participantId) {
  const cloudRows = await fetchDreamBoardAssets(participantId);
  if (!cloudRows.some((row) => String(row.image_url ?? '').startsWith('data:'))) return false;

  const assets = cloudRows
    .filter((row) => row.client_asset_id)
    .map((row) => ({
      id: String(row.client_asset_id),
      category: row.category,
      caption: row.caption ?? '',
      imageUrl: row.image_url ?? '',
    }));

  if (!assets.length) return false;
  await syncDreamBoardAssets(participantId, assets);
  return true;
}

/**
 * Merge cloud dream board images into local builder storage.
 * @param {string} participantId
 * @param {{ preferLocalImages?: boolean }} [opts]
 */
function isStaffReadHydration(opts = {}) {
  return Boolean(opts.readOnly || opts.preferRemote);
}

export async function hydrateDreamBoardImagesFromCloud(participantId, opts = {}) {
  const staffRead = isStaffReadHydration(opts);
  if (!staffRead) {
    await upgradeDreamBoardInlineCloudImages(participantId);
  }

  const cloudRows = await fetchDreamBoardAssets(participantId);
  if (!cloudRows.length) return false;

  const entry = readBuilderEntry(participantId, 'dream-board');
  const localAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    entry?.data?.assets ?? []
  );

  let merged;
  if (!staffRead && opts.preferLocalImages && localAssets.some((asset) => asset.imageUrl)) {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
    merged = merged.map((asset) => {
      const local = localAssets.find((item) => item.id === asset.id);
      return local?.imageUrl ? { ...asset, imageUrl: local.imageUrl } : asset;
    });
  } else {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
  }

  if (staffRead) {
    merged = merged.map(stripInlineDreamBoardImage);
  }

  if (!merged.length && !localAssets.length) return false;

  const nextData = {
    ...(entry?.data ?? {}),
    assets: merged.length ? merged : localAssets.map(stripInlineDreamBoardImage),
  };

  if (staffRead) {
    return true;
  }

  writeBuilderEntry(participantId, 'dream-board', nextData, Boolean(entry?.completedAt), {
    force: true,
    refining: entry?.refining,
  });

  return true;
}

/**
 * Dream board assets for staff review — cloud rows + metadata, no localStorage writes.
 * @param {string} participantId
 */
export async function fetchDreamBoardForStaffView(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return [];

  const [cloudRows, entry, builderRows] = await Promise.all([
    fetchDreamBoardAssets(participantId),
    Promise.resolve(readBuilderEntry(participantId, 'dream-board')),
    fetchDay1BuilderProgress(participantId).catch(() => []),
  ]);

  const metadataAssets = /** @type {Array<{ id?: string, category?: string, caption?: string }>} */ (
    builderRows.find((row) => row.builder_id === 'dream-board')?.payload?.data?.assets ?? []
  );

  const localAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    entry?.data?.assets ?? []
  ).map(stripInlineDreamBoardImage);

  const merged = enrichDreamBoardFromMetadata(
    mergeDreamBoardAssetLists(localAssets, cloudRows),
    metadataAssets,
  );

  return normalizeDreamBoardCards(merged);
}
