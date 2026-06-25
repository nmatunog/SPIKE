/**
 * Studio 1 raw evidence-board drafts — per-member only (no recent/filled merge).
 */
import { evidenceBoardFilledSlotCount, normalizeEvidenceBoardDraft } from './week2EvidenceBoardCandidatesCore.js';

export { normalizeEvidenceBoardDraft, padRanked, evidenceBoardFilledSlotCount } from './week2EvidenceBoardCandidatesCore.js';

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState @param {string} participantId */
export function getMemberRawEvidenceDraft(fecState, participantId) {
  const mine = fecState.evidenceBoardDraftsByMember?.[participantId];
  if (mine && evidenceBoardFilledSlotCount(mine) > 0) {
    return normalizeEvidenceBoardDraft(mine);
  }
  const legacy = fecState.evidenceBoard;
  if (legacy && String(legacy.draftBy ?? '') === participantId && evidenceBoardFilledSlotCount(legacy) > 0) {
    return normalizeEvidenceBoardDraft(legacy);
  }
  return normalizeEvidenceBoardDraft({});
}

/** @param {Record<string, import('./week2EvidenceBoardCandidatesCore.js').EvidenceBoardDraft>} map @param {Record<string, import('./week2EvidenceBoardCandidatesCore.js').EvidenceBoardDraft> | undefined} incoming */
function mergeDraftMap(map, incoming) {
  const out = { ...map };
  for (const [memberId, draft] of Object.entries(incoming ?? {})) {
    if (!draft || typeof draft !== 'object') continue;
    const normalized = normalizeEvidenceBoardDraft(draft);
    const existing = out[memberId];
    const existingAt = String(existing?.draftUpdatedAt ?? '');
    const draftAt = String(normalized.draftUpdatedAt ?? '');
    if (!existing || draftAt >= existingAt) out[memberId] = normalized;
  }
  return out;
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState | undefined} state */
function draftsFromLegacyBoard(state) {
  const board = state?.evidenceBoard;
  const by = String(board?.draftBy ?? '').trim();
  if (!by || evidenceBoardFilledSlotCount(board) <= 0) return {};
  return { [by]: normalizeEvidenceBoardDraft(board) };
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote */
export function mergeMemberEvidenceDraftMaps(local, remote) {
  let out = mergeDraftMap({}, local?.evidenceBoardDraftsByMember);
  out = mergeDraftMap(out, draftsFromLegacyBoard(local));
  out = mergeDraftMap(out, remote?.evidenceBoardDraftsByMember);
  out = mergeDraftMap(out, draftsFromLegacyBoard(remote));
  return out;
}
