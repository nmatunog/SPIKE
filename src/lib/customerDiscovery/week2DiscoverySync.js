/**
 * Week 2 discovery / interview encode — per-participant cloud sync via playbook_completions.
 */
import { upsertPlaybookCompletion, fetchPlaybookCompletions } from '../supabase/playbookProgress.js';
import { isMockUserId } from '../mockAuth.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { getSquadMemberIds } from './week2SquadEvidenceService.js';

export const WEEK2_DISCOVERY_WEEK_ID = 'week-segment-1-2';
export const WEEK2_DISCOVERY_ITEM_ID = 'week2-discovery';

/**
 * @param {string} participantId
 * @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state
 */
export async function syncWeek2DiscoveryToCloud(participantId, state) {
  if (!participantId || isMockUserId(participantId)) return;

  const payload = {
    state,
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  };

  await upsertPlaybookCompletion(
    participantId,
    'activity',
    WEEK2_DISCOVERY_ITEM_ID,
    WEEK2_DISCOVERY_WEEK_ID,
    payload,
  );
}

/**
 * @param {string} participantId
 * @param {{ preferLocal?: boolean }} [opts]
 */
export async function hydrateWeek2DiscoveryFromCloud(participantId, opts = {}) {
  if (!participantId || isMockUserId(participantId)) return loadWeek2Discovery(participantId);

  const local = loadWeek2Discovery(participantId);
  const rows = await fetchPlaybookCompletions(participantId, WEEK2_DISCOVERY_WEEK_ID).catch(() => null);
  const row = rows?.find((r) => r.item_id === WEEK2_DISCOVERY_ITEM_ID);
  const remoteState = row?.payload?.state;
  if (!remoteState || typeof remoteState !== 'object') return local;

  const remoteAt = String(remoteState.updatedAt ?? row.completed_at ?? '');
  const localAt = String(local.updatedAt ?? '');

  if (opts.preferRemote && remoteAt) {
    if (!localAt || remoteAt >= localAt) {
      return saveWeek2Discovery(participantId, remoteState, { skipCloudSync: true });
    }
    return local;
  }

  if (opts.preferLocal && localAt && (!remoteAt || localAt >= remoteAt)) return local;
  if (localAt && remoteAt && localAt >= remoteAt) return local;

  return saveWeek2Discovery(participantId, remoteState, { skipCloudSync: true });
}

/** @param {string} participantId */
export async function backfillWeek2DiscoveryToCloud(participantId) {
  if (!participantId || isMockUserId(participantId)) return;
  const state = loadWeek2Discovery(participantId);
  await syncWeek2DiscoveryToCloud(participantId, state);
}

/** @param {string} participantId */
export async function hydrateParticipantWeek2Discovery(participantId) {
  return hydrateWeek2DiscoveryFromCloud(participantId, { preferLocal: true });
}

/** Hydrate all squad members before aggregating interview evidence. */
export async function hydrateSquadWeek2Discovery(participantId) {
  const memberIds = getSquadMemberIds(participantId);
  await Promise.all(memberIds.map((id) => hydrateParticipantWeek2Discovery(id)));
}
