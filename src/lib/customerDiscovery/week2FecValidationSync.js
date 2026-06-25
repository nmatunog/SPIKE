/**
 * Cross-browser squad FEC Validation state — Supabase via playbook_completions.
 */
import { upsertPlaybookCompletion, fetchPlaybookCompletions } from '../supabase/playbookProgress.js';
import { isMockUserId } from '../mockAuth.js';
import { loadFecValidation, saveFecValidation } from './week2FecValidationStorage.js';
import { getSquadMemberIds } from './week2SquadEvidenceService.js';

import {
  mergeMemberEvidenceDraftMaps,
  mergeMemberEvidenceSourceMaps,
} from './week2EvidenceBoardCandidates.js';

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
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote
 */
export function mergeFecValidationStates(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  if (!local || typeof local !== 'object') return remote;

  const localAt = String(local.updatedAt ?? '');
  const remoteAt = String(remote.updatedAt ?? '');
  const base = remoteAt >= localAt ? { ...local, ...remote } : { ...remote, ...local };
  const approvedBoard = remote.studio1ApprovedAt
    ? remote.evidenceBoard
    : local.studio1ApprovedAt
      ? local.evidenceBoard
      : base.evidenceBoard;

  return {
    ...base,
    boxScores: { ...(local.boxScores ?? {}), ...(remote.boxScores ?? {}), ...(base.boxScores ?? {}) },
    steps: { ...(local.steps ?? {}), ...(remote.steps ?? {}) },
    squadRoles: { ...(local.squadRoles ?? {}), ...(remote.squadRoles ?? {}) },
    pitchSlides: { ...(local.pitchSlides ?? {}), ...(remote.pitchSlides ?? {}) },
    evidenceBoard: approvedBoard,
    evidenceBoardDraftsByMember: mergeMemberEvidenceDraftMaps(local, remote),
    evidenceBoardSourceByMember: mergeMemberEvidenceSourceMaps(local, remote),
    updatedAt: remoteAt >= localAt ? remoteAt : localAt,
  };
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
  const rows = await fetchPlaybookCompletions(participantId, WEEK_ID).catch(() => null);
  const row = rows?.find((r) => r.item_id === fecValidationItemId(key));
  const remoteState = row?.payload?.state;
  if (!remoteState || typeof remoteState !== 'object') return local;

  const merged = mergeFecValidationStates(local, remoteState);
  const remoteAt = String(remoteState.updatedAt ?? row.completed_at ?? '');
  const localAt = String(local.updatedAt ?? '');

  if (opts.preferLocal && localAt && (!remoteAt || localAt >= remoteAt)) {
    return saveFecValidation(key, {
      ...merged,
      evidenceBoardDraftsByMember: mergeMemberEvidenceDraftMaps(merged, local),
      evidenceBoardSourceByMember: mergeMemberEvidenceSourceMaps(merged, local),
      updatedAt: localAt,
    });
  }

  return saveFecValidation(key, merged);
}

/**
 * Pull squad FEC state from any member's cloud copy — preserves per-member draft picks.
 * @param {string} participantId
 * @param {{ preferLocalDraft?: boolean }} [opts]
 */
export async function hydrateSquadFecValidation(participantId, opts = {}) {
  const { getSquadNameForParticipant } = await import('./week2SquadEvidenceService.js');
  const key = getSquadNameForParticipant(participantId) || `solo-${participantId}`;
  const memberIds = getSquadMemberIds(participantId);
  const itemId = fecValidationItemId(key);
  let merged = loadFecValidation(key);

  const remotes = await Promise.all(
    memberIds.map(async (memberId) => {
      if (!memberId || isMockUserId(memberId)) return null;
      const rows = await fetchPlaybookCompletions(memberId, WEEK_ID).catch(() => null);
      const row = rows?.find((r) => r.item_id === itemId);
      const state = row?.payload?.state;
      return state && typeof state === 'object' ? state : null;
    }),
  );

  for (const remote of remotes) {
    if (remote) merged = mergeFecValidationStates(merged, remote);
  }

  if (opts.preferLocalDraft) {
    const local = loadFecValidation(key);
    merged = {
      ...merged,
      evidenceBoardDraftsByMember: mergeMemberEvidenceDraftMaps(merged, local),
      evidenceBoardSourceByMember: mergeMemberEvidenceSourceMaps(merged, local),
    };
  }

  const before = JSON.stringify(loadFecValidation(key));
  const after = JSON.stringify(merged);
  if (before === after) return merged;

  return saveFecValidation(key, merged);
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
  return hydrateSquadFecValidation(participantId);
}
