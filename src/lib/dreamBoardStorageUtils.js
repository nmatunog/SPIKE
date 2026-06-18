/**
 * Pure helpers for dream board Supabase Storage paths and data URLs.
 */

/**
 * @param {string} dataUrl
 * @returns {{ blob: Blob, contentType: string }}
 */
export function dataUrlToImageBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl));
  if (!match) {
    throw new Error('Invalid image data URL.');
  }
  const contentType = match[1] || 'image/jpeg';
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { blob: new Blob([bytes], { type: contentType }), contentType };
}

/** @param {string} userId @param {string} clientAssetId */
export function buildDreamBoardStoragePath(userId, clientAssetId) {
  const safeId = String(clientAssetId).replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
  return `${userId}/${safeId}.jpg`;
}

/** @param {string | null | undefined} imageUrl */
export function isHttpDreamBoardImageUrl(imageUrl) {
  const value = String(imageUrl ?? '');
  return value.startsWith('https://') || value.startsWith('http://');
}

/** @param {string | null | undefined} imageUrl */
export function isInlineDreamBoardImageUrl(imageUrl) {
  return String(imageUrl ?? '').startsWith('data:');
}

/**
 * Resolve http(s) URLs; only attach Storage URLs when the object exists (avoids broken img tags).
 * @param {string} supabaseProjectUrl
 * @param {string} participantId
 * @param {Array<{ id: string, category: string, caption: string, imageUrl?: string }>} assets
 * @param {Set<string>} storageClientIds
 */
export function attachDreamBoardStorageUrls(supabaseProjectUrl, participantId, assets, storageClientIds = new Set()) {
  return assets.map((asset) => {
    const imageUrl = String(asset.imageUrl ?? '');
    if (isHttpDreamBoardImageUrl(imageUrl) || isInlineDreamBoardImageUrl(imageUrl)) {
      return asset;
    }
    if (!storageClientIds.has(asset.id)) return asset;
    const publicUrl = dreamBoardStoragePublicUrl(supabaseProjectUrl, participantId, asset.id);
    return publicUrl ? { ...asset, imageUrl: publicUrl } : asset;
  });
}

/**
 * Stable public URL for a dream board object in Storage (bucket is public-read).
 * @param {string} supabaseProjectUrl e.g. https://xxx.supabase.co
 * @param {string} userId
 * @param {string} clientAssetId
 */
export function dreamBoardStoragePublicUrl(supabaseProjectUrl, userId, clientAssetId) {
  if (!supabaseProjectUrl || !userId || !clientAssetId) return '';
  const path = buildDreamBoardStoragePath(userId, clientAssetId);
  return `${String(supabaseProjectUrl).replace(/\/$/, '')}/storage/v1/object/public/dream-board/${path}`;
}
