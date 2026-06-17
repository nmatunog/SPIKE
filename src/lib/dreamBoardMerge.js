/**
 * Merge local dream board cards with Supabase rows (union by client asset id).
 */

/**
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} localAssets
 * @param {Array<{ client_asset_id?: string | null, category: string, caption?: string | null, image_url?: string | null, sort_order?: number | null }>} cloudRows
 */
export function mergeDreamBoardAssetLists(localAssets, cloudRows) {
  const imageByClientId = new Map(
    cloudRows
      .filter((row) => row.client_asset_id && row.image_url)
      .map((row) => [String(row.client_asset_id), String(row.image_url)]),
  );
  const sortByClientId = new Map(
    cloudRows
      .filter((row) => row.client_asset_id)
      .map((row) => [String(row.client_asset_id), row.sort_order ?? 0]),
  );

  const localIds = new Set(localAssets.map((asset) => asset.id));

  const fromLocal = localAssets.map((asset) => ({
    ...asset,
    imageUrl: asset.imageUrl || imageByClientId.get(asset.id) || '',
  }));

  const fromCloudOnly = cloudRows
    .filter((row) => row.client_asset_id && !localIds.has(String(row.client_asset_id)))
    .map((row) => ({
      id: String(row.client_asset_id),
      category: row.category,
      caption: row.caption ?? '',
      imageUrl: row.image_url ?? '',
    }));

  const merged = [...fromLocal, ...fromCloudOnly];

  if (merged.length) {
    return merged.sort((a, b) => {
      const ao = sortByClientId.get(a.id);
      const bo = sortByClientId.get(b.id);
      if (ao != null && bo != null) return ao - bo;
      if (ao != null) return -1;
      if (bo != null) return 1;
      return 0;
    });
  }

  return cloudRows
    .filter((row) => row.client_asset_id)
    .map((row) => ({
      id: String(row.client_asset_id),
      category: row.category,
      caption: row.caption ?? '',
      imageUrl: row.image_url ?? '',
    }))
    .sort((a, b) => (sortByClientId.get(a.id) ?? 0) - (sortByClientId.get(b.id) ?? 0));
}
