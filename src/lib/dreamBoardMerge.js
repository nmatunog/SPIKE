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

  const fromLocal = localAssets.map((asset) => {
    const cloudImage = imageByClientId.get(asset.id) || '';
    const localImage = asset.imageUrl || '';
    const imageUrl =
      cloudImage.startsWith('http') || cloudImage.startsWith('data:')
        ? cloudImage
        : localImage || cloudImage;
    return {
      ...asset,
      imageUrl,
    };
  });

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

/**
 * Prefer longer captions/categories from day1_builder_progress metadata (text-only cloud row).
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} assets
 * @param {Array<{ id?: string, category?: string, caption?: string }>} metadataAssets
 */
export function enrichDreamBoardFromMetadata(assets, metadataAssets) {
  const metaById = new Map(
    (metadataAssets ?? [])
      .filter((row) => row?.id)
      .map((row) => [String(row.id), row]),
  );

  const merged = assets.map((asset) => {
    const meta = metaById.get(asset.id);
    if (!meta) return asset;
    const metaCaption = String(meta.caption ?? '').trim();
    const currentCaption = String(asset.caption ?? '').trim();
    return {
      ...asset,
      category: asset.category || meta.category || 'lifestyle',
      caption: metaCaption.length > currentCaption.length ? metaCaption : currentCaption,
    };
  });

  const seen = new Set(merged.map((asset) => asset.id));
  for (const meta of metadataAssets ?? []) {
    const id = String(meta?.id ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push({
      id,
      category: meta.category ?? 'lifestyle',
      caption: String(meta.caption ?? ''),
      imageUrl: '',
    });
  }

  return merged;
}

/**
 * Merge remote metadata-only dream board payload into local draft without dropping photos.
 * @param {Record<string, unknown> | null | undefined} localData
 * @param {Record<string, unknown> | null | undefined} remoteData
 */
export function mergeDreamBoardBuilderData(localData, remoteData) {
  const localAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} */ (
    localData?.assets ?? []
  );
  const remoteAssets = /** @type {Array<{ id?: string, category?: string, caption?: string }>} */ (
    remoteData?.assets ?? []
  );

  const remoteAsCloudRows = remoteAssets
    .filter((asset) => asset?.id)
    .map((asset, index) => ({
      client_asset_id: String(asset.id),
      category: asset.category ?? 'lifestyle',
      caption: asset.caption ?? '',
      image_url: null,
      sort_order: index,
    }));

  const mergedAssets = enrichDreamBoardFromMetadata(
    mergeDreamBoardAssetLists(localAssets, remoteAsCloudRows),
    remoteAssets,
  );

  return {
    ...(typeof remoteData === 'object' && remoteData ? remoteData : {}),
    ...(typeof localData === 'object' && localData ? localData : {}),
    assets: mergedAssets,
  };
}
