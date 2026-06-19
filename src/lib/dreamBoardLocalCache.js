/**
 * Dream board localStorage shape — http(s) URLs only, no base64 blobs.
 */
import { mergeDreamBoardAssetLists } from './dreamBoardMerge.js';
import { isHttpDreamBoardImageUrl, isInlineDreamBoardImageUrl } from './dreamBoardStorageUtils.js';

/** @param {{ imageUrl?: string } & Record<string, unknown>} asset */
export function stripInlineDreamBoardImage(asset) {
  const imageUrl = String(asset?.imageUrl ?? '');
  if (!imageUrl || isInlineDreamBoardImageUrl(imageUrl)) {
    return { ...asset, imageUrl: '' };
  }
  return asset;
}

/** @param {Record<string, unknown> | null | undefined} data */
export function hasInlineDreamBoardImages(data) {
  const assets = /** @type {Array<{ imageUrl?: string }>} */ (data?.assets ?? []);
  return assets.some((asset) => isInlineDreamBoardImageUrl(asset.imageUrl));
}

/** @param {Record<string, unknown>} data */
export function stripInlineDreamBoardData(data) {
  if (!Array.isArray(data?.assets)) return data;
  return {
    ...data,
    assets: data.assets.map(stripInlineDreamBoardImage),
  };
}

/**
 * Local dream board payload with http(s) URLs only (never base64 in localStorage).
 * @param {Record<string, unknown>} localData
 * @param {Array<{ client_asset_id?: string | null, category: string, caption?: string | null, image_url?: string | null, sort_order?: number | null }>} cloudRows
 */
export function buildLocalDreamBoardDataFromCloud(localData, cloudRows) {
  const merged = mergeDreamBoardAssetLists(
    /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
      localData?.assets ?? []
    ),
    cloudRows,
  );
  return {
    ...(localData ?? {}),
    assets: merged.map((asset) => {
      const imageUrl = String(asset.imageUrl ?? '');
      if (isHttpDreamBoardImageUrl(imageUrl)) return asset;
      if (isInlineDreamBoardImageUrl(imageUrl)) return stripInlineDreamBoardImage(asset);
      return asset;
    }),
  };
}
