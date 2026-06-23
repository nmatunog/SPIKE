/**
 * Cross-browser squad FEC Validation state — Supabase via playbook_completions.
 */
import { upsertPlaybookCompletion, fetchPlaybookCompletions } from '../supabase/playbookProgress.js';
import { isMockUserId } from '../mockAuth.js';
import { loadFecValidation, saveFecValidation } from './week2FecValidationStorage.js';
import { getSquadMemberIds } from './week2SquadEvidenceService.js';

const WEEK_ID = 'week-segment-1-2';
const ITEM_PREFIX = 'week2-fec-validation';

/** @param {string} squadKey */
export function fecValidationItemId(squadKey) {
  const slug = String(squadKey ?? 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return `${ITEM_PREFIX}:${slug || 'default'}`;
}

/**
 * Push squad FEC state to cloud for all squad members (shared payload).
 * @param {string} squadKey
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} state
 * @param {string[]} [memberIds]
 */
export async function syncFecValidationToCloud(squadKey, state, memberIds = []) {
  const key = String(squadKey ?? '').trim() || 'default';
  const ids = (memberIds.length ? memberIds : [key]).filter((id) => id && !isMockUserId(id));
  if (!ids.length) return;

  const payload = {
    squadKey: key,
    state,
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  };
  const itemId = fecValidationItemId(key);

  await Promise.all(
    ids.map((userId) =>
      upsertPlaybookCompletion(userId, 'activity', itemId, WEEK_ID, payload),
    ),
  );
}

/**
 * Merge remote squad FEC state into localStorage when cloud is newer.
 * @param {string} participantId
 * @param {string} squadKey
 * @param {{ preferLocal?: boolean }} [opts]
 */
export async function hydrateFecValidationFromCloud(participantId, squadKey, opts = {}) {
  if (!participantId || isMockUserId(participantId)) return loadFecValidation(squadKey);

  const key = String(squadKey ?? '').trim() || 'default';
  const local = loadFecValidation(key);
  const rows = await fetchPlaybookCompletions(participantId).catch(() => null);
  const row = rows?.find((r) => r.item_id === fecValidationItemId(key));
  const remoteState = row?.payload?.state;
  if (!remoteState || typeof remoteState !== 'object') return local;

  const remoteAt = String(remoteState.updatedAt ?? row.completed_at ?? '');
  const localAt = String(local.updatedAt ?? '');

  if (opts.preferLocal && localAt && (!remoteAt || localAt >= remoteAt)) return local;
  if (localAt && remoteAt && localAt >= remoteAt) return local;

  return saveFecValidation(key, remoteState);
}

/** @param {string} participantId @param {string} [squadKey] */
export async function backfillFecValidationToCloud(participantId, squadKey) {
  const { getSquadNameForParticipant } = await import('./week2SquadEvidenceService.js');
  const key = squadKey || getSquadNameForParticipant(participantId) || `solo-${participantId}`;
  const state = loadFecValidation(key);
  const memberIds = getSquadMemberIds(participantId);
  await syncFecValidationToCloud(key, state, memberIds);
}

/** @param {string} participantId */
export async function hydrateParticipantFecValidation(participantId) {
  const { getSquadNameForParticipant } = await import('./week2SquadEvidenceService.js');
  const key = getSquadNameForParticipant(participantId) || `solo-${participantId}`;
  return hydrateFecValidationFromCloud(participantId, key, { preferLocal: true });
}
