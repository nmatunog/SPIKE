/**
 * Day 1 builders + Venture Coach sections — Supabase sync for staff visibility.
 */
import {
  ensureDay1User,
  readBuilderEntry,
  readDay1BuilderStore,
  writeBuilderEntry,
  writeDay1BuilderStore,
} from './day1BuilderStorage.js';
import { isDay1BuilderEditLocked } from './portfolioEditWindow.js';
import { mergeCoachSectionFromRemote, readCoachStore } from './ventureCoachStorage.js';
import {
  fetchDay1BuilderProgress,
  upsertDay1BuilderProgress,
  upsertDay1BuilderProgressSoft,
} from './supabase/day1BuilderProgress.js';
import { builderEntryHasContent, shouldApplyRemoteField } from './syncMergeUtils.js';

const COACH_PREFIX = 'coach:';

/** @type {Set<string>} */
const hydratedParticipants = new Set();

/**
 * @param {Record<string, unknown> | null | undefined} local
 * @param {{ completed_at?: string, payload?: Record<string, unknown> }} remote
 * @param {{ preferLocal?: boolean, preferRemote?: boolean }} [opts]
 */
function shouldPreferRemote(local, remote, opts = {}) {
  const remoteEntry = rowToBuilderEntry(remote);
  if (!builderEntryHasContent(remoteEntry)) return false;

  if (!local || !builderEntryHasContent(local)) return true;

  const remoteUpdated = remote.payload?.updatedAt ?? remote.completed_at;
  const localUpdated = local?.updatedAt ?? local?.completedAt;
  return shouldApplyRemoteField(local.data, remoteEntry.data, localUpdated, remoteUpdated, opts);
}

/**
 * @param {{ payload?: Record<string, unknown>, completed_at?: string }} row
 */
function rowToBuilderEntry(row) {
  const payload = row.payload ?? {};
  return {
    data: /** @type {Record<string, unknown>} */ (payload.data ?? {}),
    updatedAt: String(payload.updatedAt ?? row.completed_at ?? new Date().toISOString()),
    completedAt: payload.completedAt ? String(payload.completedAt) : null,
    firstCompletedAt: payload.firstCompletedAt ? String(payload.firstCompletedAt) : undefined,
    refining: Boolean(payload.refining),
  };
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} entry
 */
function entryToCloudPayload(entry) {
  return {
    data: /** @type {Record<string, unknown>} */ (entry.data ?? {}),
    completedAt: entry.completedAt ? String(entry.completedAt) : null,
    firstCompletedAt: entry.firstCompletedAt ? String(entry.firstCompletedAt) : undefined,
    refining: Boolean(entry.refining),
    updatedAt: entry.updatedAt ? String(entry.updatedAt) : new Date().toISOString(),
  };
}

export async function syncBuilderEntryToSupabase(participantId, builderId, entry) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  await upsertDay1BuilderProgressSoft(participantId, builderId, entryToCloudPayload(entry));
}

/**
 * Cloud-first: Supabase upsert, then local cache.
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 * @param {boolean} [completed]
 * @param {{ refining?: boolean, force?: boolean }} [options]
 */
export async function persistBuilderEntryCloudFirst(
  participantId,
  builderId,
  data,
  completed = false,
  options = {},
) {
  if (!participantId || String(participantId).startsWith('mock-')) {
    return writeBuilderEntry(participantId, builderId, data, completed, options);
  }

  const existing = readBuilderEntry(participantId, builderId);
  if (!options.force && existing && isDay1BuilderEditLocked(existing)) {
    return existing;
  }

  const now = new Date().toISOString();
  const firstCompletedAt =
    existing?.firstCompletedAt ?? (completed || existing?.completedAt ? now : undefined);

  /** @type {Record<string, unknown>} */
  let previewEntry;
  if (completed) {
    previewEntry = {
      data,
      updatedAt: now,
      firstCompletedAt: firstCompletedAt ?? now,
      completedAt: now,
      refining: false,
    };
  } else {
    previewEntry = {
      data,
      updatedAt: now,
      ...(firstCompletedAt ? { firstCompletedAt } : {}),
      ...(existing?.completedAt ? { completedAt: existing.completedAt } : {}),
      refining: options.refining ?? existing?.refining ?? false,
    };
  }

  await upsertDay1BuilderProgress(participantId, builderId, entryToCloudPayload(previewEntry));
  return writeBuilderEntry(participantId, builderId, data, completed, options);
}

/**
 * @param {string} participantId
 * @param {string} sectionId
 * @param {Record<string, unknown>} section
 */
export async function syncCoachSectionToSupabase(participantId, sectionId, section) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  await upsertDay1BuilderProgressSoft(participantId, `${COACH_PREFIX}${sectionId}`, {
    data: section.data ?? {},
    completedAt: section.completedAt ?? null,
    firstCompletedAt: section.firstCompletedAt ?? null,
    refining: Boolean(section.refining),
    step: section.step ?? 0,
    draftVersions: section.draftVersions ?? [],
    updatedAt: new Date().toISOString(),
  });
}

/** @param {string} participantId @param {{ preferLocal?: boolean, preferRemote?: boolean }} [opts] */
export async function hydrateDay1BuildersFromSupabase(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;

  try {
    const rows = await fetchDay1BuilderProgress(participantId);
    if (!rows.length) return;

    const all = ensureDay1User(participantId);
    const user = all[participantId];

    for (const row of rows) {
      if (String(row.builder_id).startsWith(COACH_PREFIX)) {
        const sectionId = String(row.builder_id).slice(COACH_PREFIX.length);
        mergeCoachSectionFromRemote(participantId, sectionId, row.payload ?? {}, opts);
        continue;
      }

      const local = user.builders[row.builder_id];
      const remoteEntry = rowToBuilderEntry(row);
      if ((!local && builderEntryHasContent(remoteEntry)) || shouldPreferRemote(local, row, opts)) {
        user.builders[row.builder_id] = remoteEntry;
      }
    }

    writeDay1BuilderStore(all);
  } catch (err) {
    console.warn('[day1BuilderSync] hydrate failed:', err instanceof Error ? err.message : err);
  }
}

/** @param {string} participantId @param {{ force?: boolean, preferLocal?: boolean, preferRemote?: boolean }} [opts] */
export async function hydrateParticipantBuilderData(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  if (opts.force) hydratedParticipants.delete(participantId);
  if (hydratedParticipants.has(participantId)) return;

  await hydrateDay1BuildersFromSupabase(participantId, opts);
  hydratedParticipants.add(participantId);
}

/** @param {string[]} participantIds @param {{ force?: boolean }} [opts] */
export async function hydrateCohortBuilderData(participantIds, opts = {}) {
  await Promise.all(participantIds.map((id) => hydrateParticipantBuilderData(id, opts)));
}

/**
 * Push all local builder + coach rows to Supabase (intern backfill on next login).
 * @param {string} participantId
 */
export async function backfillLocalBuildersToSupabase(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return;

  const builders = readDay1BuilderStore()[participantId]?.builders ?? {};
  for (const [builderId, entry] of Object.entries(builders)) {
    if (entry && builderEntryHasContent(entry)) {
      await syncBuilderEntryToSupabase(participantId, builderId, entry);
    }
  }

  const coach = readCoachStore()[participantId];
  if (coach?.sections) {
    for (const [sectionId, section] of Object.entries(coach.sections)) {
      if (section?.data && Object.keys(section.data).length > 0) {
        await syncCoachSectionToSupabase(participantId, sectionId, section);
      }
    }
  }
}
