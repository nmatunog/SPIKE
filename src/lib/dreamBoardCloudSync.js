/**
 * Dream board images sync per-card to Supabase (avoids oversized day1_builder_progress JSON).
 */
import { readBuilderEntry, writeBuilderEntry } from './day1BuilderStorage.js';
import { fetchDay1BuilderProgress } from './supabase/day1BuilderProgress.js';
import { fetchDreamBoardAssets, syncDreamBoardAssets } from './supabase/dreamBoardAssets.js';
import { mergeDreamBoardAssetLists, enrichDreamBoardFromMetadata, mergeDreamBoardBuilderData } from './dreamBoardMerge.js';
import { normalizeDreamBoardCards } from './dreamBoardConfig.js';
import { ensureDreamBoardImageInStorage, listDreamBoardStorageClientIds } from './supabase/dreamBoardStorage.js';
import {
  attachDreamBoardStorageUrls,
  isHttpDreamBoardImageUrl,
  isInlineDreamBoardImageUrl,
} from './dreamBoardStorageUtils.js';
import { canWriteParticipantRow } from './supabase/writeGuards.js';
import { isMockUserId } from './mockAuth.js';
import {
  stripInlineDreamBoardImage,
  hasInlineDreamBoardImages,
  buildLocalDreamBoardDataFromCloud,
} from './dreamBoardLocalCache.js';

export {
  stripInlineDreamBoardImage,
  hasInlineDreamBoardImages,
  stripInlineDreamBoardData,
  buildLocalDreamBoardDataFromCloud,
} from './dreamBoardLocalCache.js';

export { mergeDreamBoardAssetLists, enrichDreamBoardFromMetadata, mergeDreamBoardBuilderData } from './dreamBoardMerge.js';

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
 * Metadata row for day1_builder_progress — never shorten captions already in the cloud.
 * @param {string} participantId
 * @param {Record<string, unknown>} data
 */
export async function buildDreamBoardCloudMetadata(participantId, data) {
  const rows = await fetchDay1BuilderProgress(participantId).catch(() => []);
  const existingAssets = /** @type {Array<Record<string, unknown>>} */ (
    rows.find((row) => row.builder_id === 'dream-board')?.payload?.data?.assets ?? []
  );
  const merged = mergeDreamBoardBuilderData(
    /** @type {Record<string, unknown>} */ (data),
    { assets: existingAssets },
  );
  return dreamBoardMetadataForCloud(merged);
}

/**
 * Upload legacy inline photos to Storage and rewrite local cache with public URLs.
 * @param {string} participantId
 * @param {Record<string, unknown> | null} [sourceData]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function upgradeLocalDreamBoardInlineImages(participantId, sourceData = null) {
  if (!participantId || isMockUserId(participantId)) return null;
  if (!(await canWriteParticipantRow(participantId))) return null;

  const entry = readBuilderEntry(participantId, 'dream-board');
  const data = sourceData ?? entry?.data;
  if (!data || !hasInlineDreamBoardImages(data)) return null;

  const assets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    data.assets ?? []
  );
  /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */
  const nextAssets = [];
  let changed = false;

  for (const asset of assets) {
    if (!isInlineDreamBoardImageUrl(asset.imageUrl)) {
      nextAssets.push(asset);
      continue;
    }
    const url = await ensureDreamBoardImageInStorage(participantId, asset.id, asset.imageUrl);
    if (isHttpDreamBoardImageUrl(url)) {
      nextAssets.push({ ...asset, imageUrl: url });
      changed = true;
    } else {
      nextAssets.push(stripInlineDreamBoardImage(asset));
      changed = true;
    }
  }

  if (!changed) return null;

  const nextData = { ...data, assets: nextAssets };
  writeBuilderEntry(participantId, 'dream-board', nextData, Boolean(entry?.completedAt), {
    force: true,
    refining: entry?.refining,
  });
  await syncDreamBoardAssets(participantId, nextAssets);
  return nextData;
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
  const localHasImages = localAssets.some((asset) => asset.imageUrl);
  const cloudHasImages = cloudRows.some((row) => row.image_url);
  if (!staffRead && localHasImages && !cloudHasImages) {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
    merged = merged.map((asset) => {
      const local = localAssets.find((item) => item.id === asset.id);
      const localUrl = String(local?.imageUrl ?? '');
      if (isHttpDreamBoardImageUrl(localUrl)) return { ...asset, imageUrl: localUrl };
      return asset;
    });
  } else if (!staffRead && opts.preferLocalImages && localHasImages) {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
    merged = merged.map((asset) => {
      const local = localAssets.find((item) => item.id === asset.id);
      const localUrl = String(local?.imageUrl ?? '');
      if (isHttpDreamBoardImageUrl(localUrl)) return { ...asset, imageUrl: localUrl };
      return asset;
    });
  } else {
    merged = mergeDreamBoardAssetLists(localAssets, cloudRows);
  }

  if (staffRead) {
    merged = merged.map(stripInlineDreamBoardImage);
  }

  if (!merged.length && !localAssets.length) return false;

  const nextData = buildLocalDreamBoardDataFromCloud(
    { ...(entry?.data ?? {}), assets: merged.length ? merged : localAssets },
    cloudRows,
  );

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
 * Resolve http(s) URLs; only attach Storage URLs when the object exists (avoids broken img tags).
 * @param {string} participantId
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} assets
 * @param {Set<string>} [storageClientIds]
 */
export function attachDreamBoardStorageUrlsForParticipant(participantId, assets, storageClientIds = new Set()) {
  const base = import.meta.env.VITE_SUPABASE_URL ?? '';
  return attachDreamBoardStorageUrls(base, participantId, assets, storageClientIds);
}

/**
 * Push local dream board photos to cloud when captions synced but images did not.
 * @param {string} participantId
 */
export async function repairDreamBoardCloudImagesIfNeeded(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return false;

  const entry = readBuilderEntry(participantId, 'dream-board');
  const localAssets = /** @type {Array<{ imageUrl?: string }>} */ (entry?.data?.assets ?? []);
  if (!localAssets.some((asset) => asset.imageUrl)) return false;

  const cloudRows = await fetchDreamBoardAssets(participantId);
  const cloudHasImages = cloudRows.some((row) => row.image_url);
  if (cloudHasImages) return false;

  await syncDreamBoardToCloud(participantId, entry.data);
  return true;
}

/**
 * Dream board assets for staff review — cloud rows + metadata, no localStorage writes.
 * @param {string} participantId
 */
export async function fetchDreamBoardForStaffView(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return [];

  const [cloudRows, entry, builderRows] = await Promise.all([
    fetchDreamBoardAssets(participantId, { strict: true }),
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

  const storageClientIds = await listDreamBoardStorageClientIds(participantId);
  return normalizeDreamBoardCards(
    attachDreamBoardStorageUrlsForParticipant(participantId, merged, storageClientIds),
  );
}
