/**
 * Portfolio deliverable uploads — local index + Supabase storage sync.
 */
import { isMockUserId } from './mockAuth.js';
import { isSupabaseConfigured } from '../supabaseClient.js';
import {
  deleteDeliverableBlob,
  loadDeliverableBlob,
  saveDeliverableBlob,
} from './portfolioDeliverableBlobStore.js';
import {
  PORTFOLIO_DELIVERABLE_MAX_BYTES,
  inferDeliverableMimeType,
} from './portfolioDeliverableConstants.js';
import {
  deletePortfolioDeliverableFromSupabase,
  fetchPortfolioDeliverablesFromSupabase,
  getDeliverableDownloadUrl,
  uploadPortfolioDeliverableToSupabase,
} from './supabase/portfolioDeliverables.js';

const STORAGE_KEY = 'spike_portfolio_deliverables';

/** @typedef {import('./portfolioDeliverableConstants.js').PortfolioDeliverableCategory} PortfolioDeliverableCategory */

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
 *   localOnly: boolean,
 * }} PortfolioDeliverable
 */

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function listPortfolioDeliverablesLocal(participantId) {
  if (!participantId) return [];
  const rows = readAll()[participantId];
  return Array.isArray(rows) ? /** @type {PortfolioDeliverable[]} */ (rows) : [];
}

/** @param {string} participantId @param {PortfolioDeliverable[]} rows */
function savePortfolioDeliverablesLocal(participantId, rows) {
  if (!participantId) return;
  const all = readAll();
  all[participantId] = rows;
  writeAll(all);
}

/** @param {string} participantId */
export async function listPortfolioDeliverables(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return listPortfolioDeliverablesLocal(participantId);
  }

  const remote = await fetchPortfolioDeliverablesFromSupabase(participantId);
  if (remote) {
    const localOnly = listPortfolioDeliverablesLocal(participantId).filter((item) => item.localOnly);
    const merged = [...localOnly, ...remote].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    savePortfolioDeliverablesLocal(participantId, merged);
    return merged;
  }

  return listPortfolioDeliverablesLocal(participantId);
}

/**
 * @param {string} participantId
 * @param {File} file
 * @param {{
 *   title: string,
 *   category: PortfolioDeliverableCategory,
 *   notes?: string,
 *   week?: number | null,
 *   day?: number | null,
 * }} input
 */
export async function uploadPortfolioDeliverable(participantId, file, input) {
  if (!participantId) throw new Error('Sign in to upload deliverables.');
  if (!file) throw new Error('Choose a file to upload.');

  const mimeType = file.type || inferDeliverableMimeType(file.name);
  if (!isAllowedDeliverableFile(file.name, mimeType)) {
    throw new Error('File type not supported. Use PDF, PPT, Word, or image files.');
  }
  if (file.size > PORTFOLIO_DELIVERABLE_MAX_BYTES) {
    throw new Error('File must be under 15 MB.');
  }

  const title = String(input.title ?? '').trim() || file.name.replace(/\.[^.]+$/, '');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (isSupabaseConfigured && !isMockUserId(participantId)) {
    const result = await uploadPortfolioDeliverableToSupabase(participantId, file, {
      id,
      title,
      category: input.category,
      notes: input.notes,
      week: input.week,
      day: input.day,
    });

    if (result?.deliverable) {
      const rows = listPortfolioDeliverablesLocal(participantId).filter((item) => item.id !== id);
      rows.unshift(result.deliverable);
      savePortfolioDeliverablesLocal(participantId, rows);
      if (input.category === 'presentation') {
        void releasePitchCertificateAfterUpload(participantId, input.week ?? null);
      }
      return result.deliverable;
    }

    if (result?.error) {
      throw new Error(result.error);
    }
  }

  await saveDeliverableBlob(id, file);

  /** @type {PortfolioDeliverable} */
  const deliverable = {
    id,
    userId: participantId,
    title,
    category: input.category,
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
    storagePath: '',
    notes: String(input.notes ?? ''),
    week: input.week ?? null,
    day: input.day ?? null,
    createdAt: now,
    updatedAt: now,
    localOnly: true,
  };

  const rows = listPortfolioDeliverablesLocal(participantId);
  rows.unshift(deliverable);
  savePortfolioDeliverablesLocal(participantId, rows);
  if (input.category === 'presentation') {
    void releasePitchCertificateAfterUpload(participantId, input.week ?? null);
  }
  return deliverable;
}

/** @param {string} participantId @param {string} deliverableId */
export async function deletePortfolioDeliverable(participantId, deliverableId) {
  const rows = listPortfolioDeliverablesLocal(participantId);
  const target = rows.find((item) => item.id === deliverableId);
  if (!target) return;

  if (!target.localOnly) {
    const result = await deletePortfolioDeliverableFromSupabase(target);
    if (result?.error) throw new Error(result.error);
  }

  try {
    await deleteDeliverableBlob(deliverableId);
  } catch {
    /* blob may not exist */
  }

  savePortfolioDeliverablesLocal(
    participantId,
    rows.filter((item) => item.id !== deliverableId),
  );
}

/** @param {PortfolioDeliverable} deliverable */
export async function openPortfolioDeliverable(deliverable) {
  if (deliverable.localOnly) {
    const blob = await loadDeliverableBlob(deliverable.id);
    if (!blob) throw new Error('File not found on this device.');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const signedUrl = await getDeliverableDownloadUrl(deliverable);
  if (!signedUrl) throw new Error('Could not open file. Try again after signing in.');
  window.open(signedUrl, '_blank', 'noopener,noreferrer');
}

/** @param {string} participantId */
export async function syncLocalPortfolioDeliverablesToSupabase(participantId) {
  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured) return;

  const pending = listPortfolioDeliverablesLocal(participantId).filter((item) => item.localOnly);
  if (!pending.length) return;

  for (const item of pending) {
    const blob = await loadDeliverableBlob(item.id);
    if (!blob) continue;

    const file = new File([blob], item.fileName, { type: item.mimeType || blob.type });
    const result = await uploadPortfolioDeliverableToSupabase(participantId, file, {
      id: item.id,
      title: item.title,
      category: item.category,
      notes: item.notes,
      week: item.week,
      day: item.day,
    });

    if (result?.deliverable) {
      await deleteDeliverableBlob(item.id);
      if (item.category === 'presentation') {
        void releasePitchCertificateAfterUpload(participantId, item.week);
      }
    }
  }

  await listPortfolioDeliverables(participantId);
}

/** @param {string} fileName @param {string} mimeType */
function isAllowedDeliverableFile(fileName, mimeType) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const allowedExt = new Set(['pdf', 'pptx', 'ppt', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'webp', 'txt']);
  if (allowedExt.has(ext)) return true;

  const allowedMime = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
  ]);

  return allowedMime.has(mimeType);
}

/** @param {string} participantId */
export function countPortfolioDeliverables(participantId) {
  return listPortfolioDeliverablesLocal(participantId).length;
}

/** @param {string} participantId */
export function participantHasPitchDeckDeliverable(participantId) {
  return listPortfolioDeliverablesLocal(participantId).some((item) => item.category === 'presentation');
}

async function releasePitchCertificateAfterUpload(participantId, week) {
  try {
    const { issueCertificateForPitchDeckUpload } = await import('./stageGateService.js');
    await issueCertificateForPitchDeckUpload(participantId, { week });
  } catch (err) {
    console.warn('[portfolioDeliverables] pitch certificate:', err instanceof Error ? err.message : err);
  }
}
