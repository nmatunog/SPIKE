import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { shouldSkipSupabaseUserWrite } from './writeGuards.js';

const BUCKET = 'portfolio-deliverables';

/**
 * @typedef {import('../portfolioDeliverableConstants.js').PortfolioDeliverableCategory} PortfolioDeliverableCategory
 */

/**
 * @typedef {{
 *   id: string,
 *   userId: string,
 *   title: string,
 *   category: PortfolioDeliverableCategory,
 *   fileName: string,
 *   mimeType: string,
 *   fileSizeBytes: number,
 *   storagePath: string,
 *   notes: string,
 *   week: number | null,
 *   day: number | null,
 *   createdAt: string,
 *   updatedAt: string,
 *   localOnly?: boolean,
 * }} PortfolioDeliverable
 */

/** @param {string} fileName */
function sanitizeFileName(fileName) {
  return String(fileName ?? 'file')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 120);
}

/** @param {string} userId @param {string} deliverableId @param {string} fileName */
export function buildDeliverableStoragePath(userId, deliverableId, fileName) {
  return `${userId}/${deliverableId}/${sanitizeFileName(fileName)}`;
}

/** @param {string} userId */
export async function fetchPortfolioDeliverablesFromSupabase(userId) {
  if (!isSupabaseConfigured || !supabase || !userId || shouldSkipSupabaseUserWrite(userId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('portfolio_deliverables')
    .select(
      'id, user_id, title, category, file_name, mime_type, file_size_bytes, storage_path, notes, week, day, created_at, updated_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[portfolioDeliverables] list failed:', error.message);
    return null;
  }

  return (data ?? []).map((row) => mapRow(row));
}

/**
 * @param {string} userId
 * @param {File} file
 * @param {{
 *   id: string,
 *   title: string,
 *   category: PortfolioDeliverableCategory,
 *   notes?: string,
 *   week?: number | null,
 *   day?: number | null,
 * }} meta
 */
export async function uploadPortfolioDeliverableToSupabase(userId, file, meta) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const storagePath = buildDeliverableStoragePath(userId, meta.id, file.name);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.warn('[portfolioDeliverables] storage upload failed:', uploadError.message);
    return { error: uploadError.message };
  }

  const row = {
    id: meta.id,
    user_id: userId,
    title: meta.title,
    category: meta.category,
    file_name: file.name,
    mime_type: file.type || null,
    file_size_bytes: file.size,
    storage_path: storagePath,
    notes: meta.notes ?? '',
    week: meta.week ?? null,
    day: meta.day ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('portfolio_deliverables').upsert(row, { onConflict: 'id' });
  if (error) {
    console.warn('[portfolioDeliverables] row upsert failed:', error.message);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: error.message };
  }

  return { deliverable: mapRow(row) };
}

/** @param {PortfolioDeliverable} deliverable */
export async function deletePortfolioDeliverableFromSupabase(deliverable) {
  if (!isSupabaseConfigured || !supabase || deliverable.localOnly) return null;

  if (deliverable.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([deliverable.storagePath]);
    if (storageError) {
      console.warn('[portfolioDeliverables] storage delete failed:', storageError.message);
    }
  }

  const { error } = await supabase.from('portfolio_deliverables').delete().eq('id', deliverable.id);
  if (error) {
    console.warn('[portfolioDeliverables] row delete failed:', error.message);
    return { error: error.message };
  }

  return { ok: true };
}

/** @param {PortfolioDeliverable} deliverable */
export async function getDeliverableDownloadUrl(deliverable) {
  if (!isSupabaseConfigured || !supabase || deliverable.localOnly || !deliverable.storagePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(deliverable.storagePath, 60 * 60);

  if (error) {
    console.warn('[portfolioDeliverables] signed url failed:', error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

/** @param {Record<string, unknown>} row */
function mapRow(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ''),
    category: /** @type {PortfolioDeliverableCategory} */ (row.category ?? 'other'),
    fileName: String(row.file_name ?? ''),
    mimeType: String(row.mime_type ?? ''),
    fileSizeBytes: Number(row.file_size_bytes ?? 0),
    storagePath: String(row.storage_path ?? ''),
    notes: String(row.notes ?? ''),
    week: row.week == null ? null : Number(row.week),
    day: row.day == null ? null : Number(row.day),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    localOnly: false,
  };
}
