/**
 * Week 2 discovery save / cloud sync timestamps for UI indicators.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';

/** @param {string} participantId */
export function getWeek2SyncMeta(participantId) {
  const state = loadWeek2Discovery(participantId);
  const savedAt = state.updatedAt ?? null;
  const cloudSyncedAt = state.cloudSyncedAt ?? null;
  const pendingCloud = Boolean(savedAt && (!cloudSyncedAt || savedAt > cloudSyncedAt));
  return { savedAt, cloudSyncedAt, pendingCloud };
}

/** @param {string | null | undefined} iso */
export function formatWeek2SyncTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
