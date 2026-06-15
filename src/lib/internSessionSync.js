/**
 * Push intern browser work to Supabase — run on login and Day 1 entry.
 */
import { backfillLocalBuildersToSupabase } from './day1BuilderSync.js';
import { readBlueprintStore } from './blueprintSectionStore.js';
import { upsertBlueprintEntry } from './supabase/blueprintEntries.js';
import { isMockUserId } from './mockAuth.js';

/** 1 hour after sign-in — delayed full upload */
export const INTERN_DELAYED_UPLOAD_MS = 60 * 60 * 1000;

const SESSION_SIGNED_IN_AT_KEY = 'spike_intern_signed_in_at';

/** @type {ReturnType<typeof setTimeout> | null} */
let delayedUploadTimer = null;

/** @param {string} participantId */
async function syncLocalBlueprintEntriesToSupabase(participantId) {
  const user = readBlueprintStore()[participantId];
  if (!user) return;

  for (const [sectionSlug, fields] of Object.entries(user)) {
    for (const [fieldKey, entry] of Object.entries(fields ?? {})) {
      if (!entry?.value) continue;
      await upsertBlueprintEntry(participantId, sectionSlug, fieldKey, String(entry.value), {
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
      });
    }
  }
}

/**
 * Upload all local Day 1 + blueprint data to Supabase (idempotent).
 * @param {string} participantId
 */
export async function syncInternLocalWorkToSupabase(participantId) {
  if (!participantId || isMockUserId(participantId)) return;

  await Promise.all([
    backfillLocalBuildersToSupabase(participantId),
    syncLocalBlueprintEntriesToSupabase(participantId),
  ]);
}

/** Clear delayed-upload timer and session marker (sign-out). */
export function clearInternDelayedUploadSchedule() {
  if (delayedUploadTimer) {
    clearTimeout(delayedUploadTimer);
    delayedUploadTimer = null;
  }
  try {
    sessionStorage.removeItem(SESSION_SIGNED_IN_AT_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * Schedule a full upload INTERN_DELAYED_UPLOAD_MS after first sign-in this tab session.
 * Survives refresh — uses sessionStorage for signed-in timestamp.
 * @param {string} participantId
 * @returns {() => void} cancel
 */
export function scheduleInternDelayedUpload(participantId) {
  clearInternDelayedUploadSchedule();

  if (!participantId || isMockUserId(participantId)) {
    return () => {};
  }

  const now = Date.now();
  let signedInAt = now;
  try {
    const stored = sessionStorage.getItem(SESSION_SIGNED_IN_AT_KEY);
    if (stored) {
      signedInAt = Number(stored) || now;
    } else {
      sessionStorage.setItem(SESSION_SIGNED_IN_AT_KEY, String(now));
    }
  } catch {
    signedInAt = now;
  }

  const elapsed = now - signedInAt;
  const remaining = Math.max(0, INTERN_DELAYED_UPLOAD_MS - elapsed);

  delayedUploadTimer = setTimeout(() => {
    delayedUploadTimer = null;
    void syncInternLocalWorkToSupabase(participantId);
  }, remaining);

  return clearInternDelayedUploadSchedule;
}
