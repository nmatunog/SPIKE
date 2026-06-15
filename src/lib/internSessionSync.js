/**
 * Push intern browser work to Supabase — run on login and Day 1 entry.
 */
import { backfillLocalBuildersToSupabase } from './day1BuilderSync.js';
import { readBlueprintStore } from './blueprintSectionStore.js';
import { upsertBlueprintEntry } from './supabase/blueprintEntries.js';
import { isMockUserId } from './mockAuth.js';

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
