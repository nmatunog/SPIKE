import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import {
  buildDreamBoardStoragePath,
  dataUrlToImageBlob,
  isHttpDreamBoardImageUrl,
  isInlineDreamBoardImageUrl,
} from '../dreamBoardStorageUtils.js';

export {
  buildDreamBoardStoragePath,
  dataUrlToImageBlob,
  isHttpDreamBoardImageUrl,
  isInlineDreamBoardImageUrl,
} from '../dreamBoardStorageUtils.js';

export const DREAM_BOARD_BUCKET = 'dream-board';

/**
 * Upload a compressed dream board photo and return a stable public URL for coach view.
 * @param {string} userId
 * @param {string} clientAssetId
 * @param {string} imageUrl data URL or existing http URL
 * @returns {Promise<string | null>}
 */
export async function ensureDreamBoardImageInStorage(userId, clientAssetId, imageUrl) {
  if (!imageUrl) return null;
  if (isHttpDreamBoardImageUrl(imageUrl)) return imageUrl;
  if (!isInlineDreamBoardImageUrl(imageUrl)) return imageUrl;
  if (!isSupabaseConfigured || !supabase || !userId || !clientAssetId) return imageUrl;

  const storagePath = buildDreamBoardStoragePath(userId, clientAssetId);
  const { blob, contentType } = dataUrlToImageBlob(imageUrl);

  const { error } = await supabase.storage.from(DREAM_BOARD_BUCKET).upload(storagePath, blob, {
    upsert: true,
    contentType,
    cacheControl: '31536000',
  });

  if (error) {
    console.warn('[dreamBoardStorage] upload failed:', clientAssetId, error.message);
    return imageUrl;
  }

  const { data } = supabase.storage.from(DREAM_BOARD_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl ?? imageUrl;
}
