/**
 * Device-local intern work snapshots (IndexedDB + optional JSON download).
 */
import { isMockUserId } from './mockAuth.js';

const BACKUP_DB_NAME = 'spike_intern_device_backups';
const BACKUP_DB_VERSION = 1;
const BACKUP_STORE = 'snapshots';
const MAX_SNAPSHOTS_PER_USER = 8;

/** localStorage keys that hold intern playbook, portfolio, blueprint, and research work. */
export const INTERN_WORK_STORAGE_KEYS = [
  'spike_day1_builders',
  'spike_venture_coach_v1',
  'spike_blueprint_section_entries',
  'spike_playbook_progress_v1',
  'spike_playbook_local_progress',
  'spike_survey_responses',
  'spike_canvas_entries',
  'spike_canvas_milestone_30',
  'spike_portfolio_deliverables',
  'spike_venture_portfolio_settings',
  'spike_blueprint_artifacts',
  'spike_cohort_formation_v1',
  'spike_career_track_confirmed',
  'spike_blueprint_timeline',
  'spike_fna_records',
  'spike_research_analytics',
  'spike_week2_discovery_v1',
  'spike_squad_mentor_review_v1',
  'spike_squad_stage_gate_v1',
  'spike_squad_commendations_v1',
  'spike_squad_ratings_v1',
  'spike_client_growth_funnel',
  'spike_leadership_journal_v1',
  'spike_squad_charters',
  'spike_canvas_summary',
];

/** @returns {Promise<IDBDatabase>} */
function openBackupDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB_NAME, BACKUP_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        const store = db.createObjectStore(BACKUP_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('participantId', 'participantId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Backup IndexedDB open failed'));
  });
}

/**
 * @param {string} participantId
 */
export function collectInternLocalStorageSnapshot(participantId) {
  /** @type {Record<string, string | null>} */
  const keys = {};
  for (const key of INTERN_WORK_STORAGE_KEYS) {
    try {
      keys[key] = localStorage.getItem(key);
    } catch {
      keys[key] = null;
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith('spike_user_squad_')) continue;
    if (key.includes(participantId)) {
      try {
        keys[key] = localStorage.getItem(key);
      } catch {
        keys[key] = null;
      }
    }
  }

  return {
    version: 1,
    participantId,
    exportedAt: new Date().toISOString(),
    keys,
  };
}

/**
 * @param {string} participantId
 */
export function downloadInternBackupJson(participantId) {
  const snapshot = collectInternLocalStorageSnapshot(participantId);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `spike-intern-backup-${participantId.slice(0, 8)}-${stamp}.json`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return snapshot.exportedAt;
}

/**
 * Persist snapshot in IndexedDB and prune old copies.
 * @param {string} participantId
 */
export async function saveLocalInternBackup(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return { skipped: true, keyCount: 0 };
  }

  const snapshot = collectInternLocalStorageSnapshot(participantId);
  const keyCount = Object.values(snapshot.keys).filter((v) => v != null && v !== '').length;

  const db = await openBackupDb();
  const id = await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    tx.onerror = () => reject(tx.error ?? new Error('Backup write failed'));
    const store = tx.objectStore(BACKUP_STORE);
    const request = store.add({
      participantId,
      createdAt: snapshot.exportedAt,
      snapshot,
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Backup add failed'));
    tx.oncomplete = () => db.close();
  });

  await pruneOldSnapshots(participantId);

  let downloadedAt = null;
  try {
    downloadedAt = downloadInternBackupJson(participantId);
  } catch (err) {
    console.warn('[internLocalBackup] JSON download skipped:', err);
  }

  return {
    id,
    keyCount,
    exportedAt: snapshot.exportedAt,
    downloadedAt,
  };
}

/** @param {string} participantId */
async function pruneOldSnapshots(participantId) {
  const db = await openBackupDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    const store = tx.objectStore(BACKUP_STORE);
    const index = store.index('participantId');
    const request = index.getAll(participantId);
    request.onsuccess = () => {
      const rows = /** @type {Array<{ id: number, createdAt: string }>} */ (request.result ?? []);
      const sorted = [...rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const excess = sorted.slice(MAX_SNAPSHOTS_PER_USER);
      for (const row of excess) {
        store.delete(row.id);
      }
      resolve();
    };
    request.onerror = () => reject(request.error ?? new Error('Backup prune read failed'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error ?? new Error('Backup prune failed'));
  });
}

/** @param {string} participantId */
export async function listLocalInternBackups(participantId) {
  const db = await openBackupDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, 'readonly');
    const index = tx.objectStore(BACKUP_STORE).index('participantId');
    const request = index.getAll(participantId);
    request.onsuccess = () => {
      const rows = /** @type {Array<{ id: number, createdAt: string }>} */ (request.result ?? []);
      resolve(
        rows
          .map((row) => ({ id: row.id, createdAt: row.createdAt }))
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
      );
    };
    request.onerror = () => reject(request.error ?? new Error('Backup list failed'));
    tx.oncomplete = () => db.close();
  });
}
