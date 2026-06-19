/**
 * Dream board photos upload to Supabase Storage first; local cache keeps http(s) URLs only.
 */
import { isSupabaseConfigured } from '../supabaseClient.js';
import { readDreamBoardImageFile } from './dreamBoardImage.js';
import { isHttpDreamBoardImageUrl } from './dreamBoardStorageUtils.js';
import { ensureDreamBoardImageInStorage } from './supabase/dreamBoardStorage.js';
import { canWriteParticipantRow } from './supabase/writeGuards.js';
import { isMockUserId } from './mockAuth.js';

/**
 * Compress, upload to Supabase Storage, return a stable public URL.
 * Mock / offline dev may still return a data URL.
 * @param {string} participantId
 * @param {string} clientAssetId
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadDreamBoardPhoto(participantId, clientAssetId, file) {
  const dataUrl = await readDreamBoardImageFile(file);

  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured) {
    return dataUrl;
  }

  if (!(await canWriteParticipantRow(participantId))) {
    throw new Error('Sign in to upload dream board photos.');
  }

  const url = await ensureDreamBoardImageInStorage(participantId, clientAssetId, dataUrl);
  if (!isHttpDreamBoardImageUrl(url)) {
    throw new Error('Photo upload failed. Check your connection and try again.');
  }

  return url;
}
