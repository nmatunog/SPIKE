/**
 * Sign-out pipeline — cloud upload then device backup.
 * Invoked automatically from AuthContext before session clears.
 */
import { syncInternLocalWorkToSupabase } from './internSessionSync.js';
import { saveLocalInternBackup } from './internLocalBackup.js';
import { isMockUserId } from './mockAuth.js';

/**
 * @typedef {'cloud_sync' | 'local_backup' | 'completed' | 'error'} InternLogoutPhase
 * @typedef {{ phase: InternLogoutPhase, message: string, error?: string, cloudOk?: boolean, backup?: object }} InternLogoutStatus
 */

/**
 * @param {string} participantId
 * @param {(status: InternLogoutStatus) => void} [onProgress]
 */
export async function runInternLogoutBackup(participantId, onProgress) {
  if (!participantId || isMockUserId(participantId)) {
    return { skipped: true, cloudOk: true };
  }

  let cloudOk = true;
  let cloudError = '';

  onProgress?.({
    phase: 'cloud_sync',
    message: 'Saving playbook, portfolio, and deliverables to the cloud…',
  });

  try {
    await syncInternLocalWorkToSupabase(participantId);
  } catch (err) {
    cloudOk = false;
    cloudError = err instanceof Error ? err.message : String(err);
    onProgress?.({
      phase: 'cloud_sync',
      message: 'Cloud save had an issue — creating a device backup now…',
      error: cloudError,
      cloudOk: false,
    });
  }

  onProgress?.({
    phase: 'local_backup',
    message: 'Creating a device backup on this browser…',
    cloudOk,
  });

  let backup = null;
  try {
    backup = await saveLocalInternBackup(participantId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.({
      phase: 'error',
      message: 'Device backup failed. Your work is still in this browser until you sign in again.',
      error: message,
      cloudOk,
    });
    throw err;
  }

  onProgress?.({
    phase: 'completed',
    message: cloudOk
      ? 'Cloud save and device backup complete.'
      : 'Device backup saved. Cloud sync will retry on your next sign-in.',
    cloudOk,
    backup,
    error: cloudError || undefined,
  });

  return { cloudOk, backup, cloudError: cloudError || undefined };
}
