/**
 * Week 2 discovery / interview encode — per-participant cloud sync via playbook_completions.
 */
import { upsertPlaybookCompletion, fetchPlaybookCompletions } from '../supabase/playbookProgress.js';
import { isMockUserId } from '../mockAuth.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { mergeWeek2DiscoveryStates } from './week2DiscoveryMerge.js';
import { getSquadMemberIds } from './week2SquadEvidenceService.js';
import { week2MissionProgressPct } from './week2MissionService.js';

export const WEEK2_DISCOVERY_WEEK_ID = 'week-segment-1-2';
export const WEEK2_DISCOVERY_ITEM_ID = 'week2-discovery';

/** @type {Set<string>} */
const hydratedParticipants = new Set();

/**
 * @param {string} participantId
 * @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state
 */
export async function syncWeek2DiscoveryToCloud(participantId, state) {
  if (!participantId || isMockUserId(participantId)) return null;

  const payload = {
    state,
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  };

  const ok = await upsertPlaybookCompletion(
    participantId,
    'activity',
    WEEK2_DISCOVERY_ITEM_ID,
    WEEK2_DISCOVERY_WEEK_ID,
    payload,
  );

  if (!ok) return null;

  const cloudSyncedAt = new Date().toISOString();
  saveWeek2Discovery(participantId, { cloudSyncedAt }, { skipCloudSync: true });

  if (week2MissionProgressPct(participantId, 1) === 100) {
    const { supabase, isSupabaseConfigured } = await import('../../supabaseClient.js');
    if (isSupabaseConfigured && supabase) {
      const { error: propagateErr } = await supabase.rpc('propagate_week2_discovery_to_empty_squad_mates');
      if (propagateErr) {
        console.warn('[week2Discovery] propagate RPC failed:', propagateErr.message);
      }
    }
  }

  return cloudSyncedAt;
}

/**
 * @param {string} participantId
 * @param {{ preferLocal?: boolean, preferRemote?: boolean, force?: boolean }} [opts]
 */
export async function hydrateWeek2DiscoveryFromCloud(participantId, opts = {}) {
  if (!participantId || isMockUserId(participantId)) return loadWeek2Discovery(participantId);

  if (opts.force) hydratedParticipants.delete(participantId);
  if (!opts.force && hydratedParticipants.has(participantId)) {
    return loadWeek2Discovery(participantId);
  }

  const local = loadWeek2Discovery(participantId);
  const rows = await fetchPlaybookCompletions(participantId, WEEK2_DISCOVERY_WEEK_ID).catch(() => null);
  const row = rows?.find((r) => r.item_id === WEEK2_DISCOVERY_ITEM_ID);
  const remoteState = row?.payload?.state;
  if (!remoteState || typeof remoteState !== 'object') {
    hydratedParticipants.add(participantId);
    return local;
  }

  const remoteAt = String(remoteState.updatedAt ?? row.completed_at ?? '');
  const localAt = String(local.updatedAt ?? '');

  if (opts.preferRemote && remoteAt) {
    if (!localAt || remoteAt >= localAt) {
      const merged = saveWeek2Discovery(participantId, remoteState, { skipCloudSync: true });
      hydratedParticipants.add(participantId);
      return merged;
    }
    hydratedParticipants.add(participantId);
    return local;
  }

  if (opts.preferLocal && localAt && (!remoteAt || localAt >= remoteAt)) {
    const merged = saveWeek2Discovery(
      participantId,
      mergeWeek2DiscoveryStates(local, remoteState),
      { skipCloudSync: true },
    );
    hydratedParticipants.add(participantId);
    return merged;
  }

  const mergedState = mergeWeek2DiscoveryStates(local, remoteState);
  const merged = saveWeek2Discovery(participantId, mergedState, { skipCloudSync: true });
  hydratedParticipants.add(participantId);
  return merged;
}

/** @param {string} participantId */
export async function backfillWeek2DiscoveryToCloud(participantId) {
  if (!participantId || isMockUserId(participantId)) return;
  const state = loadWeek2Discovery(participantId);
  await syncWeek2DiscoveryToCloud(participantId, state);
}

/**
 * @param {string} participantId
 * @param {{ force?: boolean }} [opts]
 */
export async function hydrateParticipantWeek2Discovery(participantId, opts = {}) {
  return hydrateWeek2DiscoveryFromCloud(participantId, { force: opts.force ?? false });
}

/** Hydrate all squad members; auto-fill empty accounts from the fullest squadmate. */
export async function hydrateSquadWeek2Discovery(participantId) {
  const memberIds = getSquadMemberIds(participantId);
  await Promise.all(memberIds.map((id) => hydrateParticipantWeek2Discovery(id, { force: true })));

  try {
    const { autoHydrateAndSyncSquadWeek2Discovery } = await import('./week2SquadDataAdoptService.js');
    await autoHydrateAndSyncSquadWeek2Discovery(participantId);
  } catch (err) {
    console.warn('[week2Discovery] squad adopt sync failed:', err?.message ?? err);
  }

  await Promise.all(memberIds.map((id) => hydrateParticipantWeek2Discovery(id, { force: true })));
}

/** @param {string} participantId */
export function invalidateWeek2DiscoveryHydration(participantId) {
  hydratedParticipants.delete(participantId);
}
