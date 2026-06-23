/**
 * Push intern browser work to Supabase — run on login and Day 1 entry.
 */
import { backfillLocalBuildersToSupabase } from './day1BuilderSync.js';
import { readBlueprintStore } from './blueprintSectionStore.js';
import { upsertBlueprintEntry } from './supabase/blueprintEntries.js';
import { backfillLocalPlaybookToSupabase } from './playbookProgressSync.js';
import { backfillLocalSurveysToSupabase } from './surveyService.js';
import { backfillLocalCanvasToSupabase } from './canvasService.js';
import { isMockUserId } from './mockAuth.js';
import { hydrateParticipantBuilderData } from './day1BuilderSync.js';
import { hydratePlaybookProgressFromSupabase } from './playbookProgressSync.js';
import { hydrateSurveysFromSupabase } from './surveyService.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';
import { assessLocalInternWork } from './internLocalWorkAssessment.js';
import { fetchRemoteWorkAssessment } from './participantRemoteData.js';
import { needsCloudRecovery, recoverInternWorkFromSupabase } from './internCloudRecovery.js';
import { syncLocalPortfolioDeliverablesToSupabase } from './portfolioDeliverableService.js';
import { backfillFecValidationToCloud, hydrateParticipantFecValidation } from './customerDiscovery/week2FecValidationSync.js';
import {
  backfillWeek2DiscoveryToCloud,
  hydrateParticipantWeek2Discovery,
} from './customerDiscovery/week2DiscoverySync.js';

/** @type {Map<string, Promise<{ skipped?: boolean, uploaded?: boolean, alreadyDone?: boolean }>>} */
const signInUploadByUser = new Map();

/** 1 hour after sign-in — delayed full upload safety net */
export const INTERN_DELAYED_UPLOAD_MS = 60 * 60 * 1000;

const SESSION_SIGNED_IN_AT_KEY = 'spike_intern_signed_in_at';
const SIGNIN_UPLOAD_DONE_KEY = 'spike_intern_signin_upload_done';

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
 * Upload all local participant work to Supabase (idempotent).
 * @param {string} participantId
 */
export async function syncInternLocalWorkToSupabase(participantId) {
  if (!participantId || isMockUserId(participantId)) return;

  await Promise.all([
    backfillLocalBuildersToSupabase(participantId),
    syncLocalBlueprintEntriesToSupabase(participantId),
    backfillLocalPlaybookToSupabase(participantId),
    backfillLocalSurveysToSupabase(participantId),
    backfillLocalCanvasToSupabase(participantId),
    syncLocalPortfolioDeliverablesToSupabase(participantId),
    backfillFecValidationToCloud(participantId),
    backfillWeek2DiscoveryToCloud(participantId),
  ]);
}

const internHydrateOpts = { preferLocal: true };

/**
 * After upload, merge cloud rows into local cache without wiping device work.
 * @param {string} participantId
 */
export async function hydrateInternWorkFromSupabase(participantId) {
  if (!participantId || isMockUserId(participantId)) return;

  await Promise.all([
    hydrateParticipantBuilderData(participantId, { force: true, preferLocal: true }),
    hydrateVentureBlueprint(participantId, internHydrateOpts),
    hydratePlaybookProgressFromSupabase(participantId, { force: true, ...internHydrateOpts }),
    hydrateSurveysFromSupabase(participantId, { force: true, ...internHydrateOpts }),
    hydrateParticipantFecValidation(participantId),
    hydrateParticipantWeek2Discovery(participantId),
  ]);
}

/** @param {string} participantId */
export function whenInternSignInUploadDone(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return Promise.resolve({ skipped: true });
  }
  const inFlight = signInUploadByUser.get(participantId);
  if (inFlight) return inFlight;
  try {
    if (sessionStorage.getItem(SIGNIN_UPLOAD_DONE_KEY) === participantId) {
      return Promise.resolve({ alreadyDone: true });
    }
  } catch {
    /* private mode */
  }
  return runInternSignInCloudUpload(participantId);
}

/**
 * First sign-in this tab session: upload all local Day 1 + blueprint work to Supabase.
 * @param {string} participantId
 */
export async function runInternSignInCloudUpload(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return { skipped: true };
  }

  const existing = signInUploadByUser.get(participantId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      if (sessionStorage.getItem(SIGNIN_UPLOAD_DONE_KEY) === participantId) {
        return { skipped: true, alreadyDone: true };
      }
    } catch {
      /* private mode */
    }

    const local = assessLocalInternWork(participantId);
    const remote = await fetchRemoteWorkAssessment(participantId);
    let recovered = false;

    if (needsCloudRecovery(local, remote)) {
      await recoverInternWorkFromSupabase(participantId);
      recovered = true;
    }

    await syncInternLocalWorkToSupabase(participantId);
    if (!recovered) {
      await hydrateInternWorkFromSupabase(participantId);
    }

    try {
      sessionStorage.setItem(SIGNIN_UPLOAD_DONE_KEY, participantId);
    } catch {
      /* private mode */
    }

    return { uploaded: true, recovered };
  })();

  signInUploadByUser.set(participantId, promise);
  try {
    return await promise;
  } finally {
    signInUploadByUser.delete(participantId);
  }
}

/** Clear delayed-upload timer and session markers (sign-out). */
export function clearInternDelayedUploadSchedule() {
  if (delayedUploadTimer) {
    clearTimeout(delayedUploadTimer);
    delayedUploadTimer = null;
  }
  signInUploadByUser.clear();
  try {
    sessionStorage.removeItem(SESSION_SIGNED_IN_AT_KEY);
    sessionStorage.removeItem(SIGNIN_UPLOAD_DONE_KEY);
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
  if (delayedUploadTimer) {
    clearTimeout(delayedUploadTimer);
    delayedUploadTimer = null;
  }

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
