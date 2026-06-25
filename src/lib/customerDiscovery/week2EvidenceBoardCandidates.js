/**
 * Squad evidence-board variants — most recent save vs richest merged slots.
 */
import { loadFecValidation, saveFecValidation } from './week2FecValidationStorage.js';
import { getSquadNameForParticipant, squadEvidenceSummary } from './week2SquadEvidenceService.js';
import { syncFecValidationToCloud } from './week2FecValidationSync.js';

/** @typedef {'recent' | 'filled'} EvidenceBoardSourceChoice */

/**
 * @typedef {Object} EvidenceBoardDraft
 * @property {Array<{ text: string, count: number }>} [topGoals]
 * @property {Array<{ text: string, count: number }>} [topProblems]
 * @property {Array<{ text: string, count: number }>} [topOpportunities]
 * @property {string[]} [starredQuotes]
 * @property {string} [draftUpdatedAt]
 * @property {string} [draftBy]
 */

/**
 * @typedef {Object} EvidenceBoardCandidateView
 * @property {EvidenceBoardSourceChoice} id
 * @property {string} label
 * @property {string} description
 * @property {EvidenceBoardDraft} board
 * @property {{ filledSlots: number, totalSlots: number, draftAt: string, draftBy: string, memberLabel: string }} meta
 */

/** @param {string} participantId */
export function squadKeyForParticipant(participantId) {
  return getSquadNameForParticipant(participantId) || `solo-${participantId}`;
}

/** @param {Array<{ text?: string, count?: number }> | undefined} rows @param {number} limit */
export function padRanked(rows, limit = 3) {
  const out = (Array.isArray(rows) ? rows : []).slice(0, limit).map((row) => ({
    text: String(row?.text ?? ''),
    count: Number(row?.count ?? 0) || 0,
  }));
  while (out.length < limit) out.push({ text: '', count: 0 });
  return out;
}

/** @param {EvidenceBoardDraft | Record<string, unknown> | undefined} board */
export function evidenceBoardFilledSlotCount(board) {
  const sections = [board?.topGoals, board?.topProblems, board?.topOpportunities];
  return sections.reduce(
    (n, rows) => n + (Array.isArray(rows) ? rows.filter((r) => String(r?.text ?? '').trim()).length : 0),
    0,
  );
}

/** @param {{ text?: string, count?: number }} slotA @param {{ text?: string, count?: number }} slotB */
function pickRicherRankedSlot(slotA, slotB) {
  const textA = String(slotA?.text ?? '').trim();
  const textB = String(slotB?.text ?? '').trim();
  if (!textA && !textB) return { text: '', count: 0 };
  if (!textA) return { text: textB, count: Number(slotB?.count ?? 0) || 0 };
  if (!textB) return { text: textA, count: Number(slotA?.count ?? 0) || 0 };
  if (textB.length > textA.length) return { text: textB, count: Number(slotB?.count ?? 0) || 0 };
  if (textA.length > textB.length) return { text: textA, count: Number(slotA?.count ?? 0) || 0 };
  const countA = Number(slotA?.count ?? 0) || 0;
  const countB = Number(slotB?.count ?? 0) || 0;
  return countB > countA ? { text: textB, count: countB } : { text: textA, count: countA };
}

/** @param {Array<{ text?: string, count?: number }> | undefined} a @param {Array<{ text?: string, count?: number }> | undefined} b */
export function mergeRankedSlotsBySlot(a, b, limit = 3) {
  const left = padRanked(a, limit);
  const right = padRanked(b, limit);
  return left.map((slot, index) => pickRicherRankedSlot(slot, right[index]));
}

/** @param {string[] | undefined} a @param {string[] | undefined} b */
export function mergeStarredQuotes(a, b) {
  const listA = Array.isArray(a) ? a.map((q) => String(q ?? '').trim()).filter(Boolean) : [];
  const listB = Array.isArray(b) ? b.map((q) => String(q ?? '').trim()).filter(Boolean) : [];
  const primary = listA.length >= listB.length ? listA : listB;
  const secondary = listA.length >= listB.length ? listB : listA;
  const merged = [...primary];
  for (const quote of secondary) {
    if (merged.length >= 5) break;
    if (!merged.includes(quote)) merged.push(quote);
  }
  return merged.slice(0, 5);
}

/** @param {EvidenceBoardDraft} draft */
export function normalizeEvidenceBoardDraft(draft) {
  return {
    topGoals: padRanked(draft.topGoals),
    topProblems: padRanked(draft.topProblems),
    topOpportunities: padRanked(draft.topOpportunities),
    starredQuotes: Array.isArray(draft.starredQuotes) ? draft.starredQuotes.filter(Boolean).slice(0, 5) : [],
    draftUpdatedAt: String(draft.draftUpdatedAt ?? ''),
    draftBy: String(draft.draftBy ?? ''),
  };
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState */
function collectMemberDrafts(fecState) {
  /** @type {EvidenceBoardDraft[]} */
  const drafts = [];
  const byMember = fecState.evidenceBoardDraftsByMember ?? {};
  for (const draft of Object.values(byMember)) {
    if (draft && typeof draft === 'object') drafts.push(normalizeEvidenceBoardDraft(draft));
  }
  if (fecState.evidenceBoard && evidenceBoardFilledSlotCount(fecState.evidenceBoard) > 0) {
    drafts.push(normalizeEvidenceBoardDraft(fecState.evidenceBoard));
  }
  return drafts;
}

/** @param {EvidenceBoardDraft[]} drafts */
function buildMostFilledDraft(drafts) {
  if (!drafts.length) {
    return normalizeEvidenceBoardDraft({});
  }
  let merged = normalizeEvidenceBoardDraft(drafts[0]);
  for (let i = 1; i < drafts.length; i += 1) {
    const next = normalizeEvidenceBoardDraft(drafts[i]);
    merged = {
      ...merged,
      topGoals: mergeRankedSlotsBySlot(merged.topGoals, next.topGoals),
      topProblems: mergeRankedSlotsBySlot(merged.topProblems, next.topProblems),
      topOpportunities: mergeRankedSlotsBySlot(merged.topOpportunities, next.topOpportunities),
      starredQuotes: mergeStarredQuotes(merged.starredQuotes, next.starredQuotes),
    };
  }
  return merged;
}

/** @param {EvidenceBoardDraft[]} drafts */
function pickMostRecentDraft(drafts) {
  if (!drafts.length) return normalizeEvidenceBoardDraft({});
  return drafts.reduce((best, draft) => {
    const bestAt = String(best.draftUpdatedAt ?? '');
    const draftAt = String(draft.draftUpdatedAt ?? '');
    if (draftAt > bestAt) return draft;
    if (draftAt < bestAt) return best;
    return evidenceBoardFilledSlotCount(draft) > evidenceBoardFilledSlotCount(best) ? draft : best;
  });
}

/** @param {EvidenceBoardDraft} board */
function boardContentSignature(board) {
  const norm = normalizeEvidenceBoardDraft(board);
  return JSON.stringify({
    topGoals: norm.topGoals.map((r) => r.text),
    topProblems: norm.topProblems.map((r) => r.text),
    topOpportunities: norm.topOpportunities.map((r) => r.text),
    starredQuotes: norm.starredQuotes,
  });
}

/**
 * @param {string} memberId
 * @param {Record<string, string>} [memberNames]
 */
function memberLabel(memberId, memberNames = {}) {
  if (!memberId) return 'Squad';
  return memberNames[memberId] || `Member ${String(memberId).slice(0, 6)}`;
}

/**
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState
 * @param {Record<string, string>} [memberNames]
 */
export function deriveEvidenceBoardCandidates(fecState, memberNames = {}) {
  const drafts = collectMemberDrafts(fecState);
  const recent = pickMostRecentDraft(drafts);
  const filled = buildMostFilledDraft(drafts);
  const totalSlots = 9;

  const toView = (id, label, description, board) => ({
    id,
    label,
    description,
    board: normalizeEvidenceBoardDraft(board),
    meta: {
      filledSlots: evidenceBoardFilledSlotCount(board),
      totalSlots,
      draftAt: String(board.draftUpdatedAt ?? ''),
      draftBy: String(board.draftBy ?? ''),
      memberLabel: memberLabel(String(board.draftBy ?? ''), memberNames),
    },
  });

  const recentView = toView(
    'recent',
    'Most recent save',
    'The latest squad member edit — use when you want the newest wording.',
    recent,
  );
  const filledView = toView(
    'filled',
    'Most filled slots',
    'Best available line in each rank across all squad saves.',
    filled,
  );

  const hasContent = drafts.some((d) => evidenceBoardFilledSlotCount(d) > 0);
  const hasChoice =
    hasContent
    && boardContentSignature(recent) !== boardContentSignature(filled);

  return {
    recent: recentView,
    filled: filledView,
    hasChoice,
    locked: Boolean(fecState.studio1ApprovedAt),
  };
}

/** @param {string} participantId @param {Record<string, string>} [memberNames] */
export function getEvidenceBoardChoiceContext(participantId, memberNames = {}) {
  const key = squadKeyForParticipant(participantId);
  const fec = loadFecValidation(key);
  const candidates = deriveEvidenceBoardCandidates(fec, memberNames);
  const source = getMemberEvidenceBoardSource(fec, participantId);
  const active = source === 'recent' ? candidates.recent : candidates.filled;
  return {
    ...candidates,
    activeSource: source,
    activeBoard: active.board,
  };
}

/**
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState
 * @param {string} participantId
 */
export function getMemberEvidenceBoardSource(fecState, participantId) {
  const choice = fecState.evidenceBoardSourceByMember?.[participantId];
  return choice === 'recent' ? 'recent' : 'filled';
}

/**
 * @param {string} participantId
 * @param {EvidenceBoardSourceChoice} source
 */
export function setMemberEvidenceBoardSource(participantId, source) {
  const key = squadKeyForParticipant(participantId);
  const current = loadFecValidation(key);
  const next = saveFecValidation(key, {
    evidenceBoardSourceByMember: {
      ...(current.evidenceBoardSourceByMember ?? {}),
      [participantId]: source,
    },
  });
  void syncFecValidationToCloud(key, next, squadEvidenceSummary(participantId).memberIds).catch(() => {});
  return next;
}

/** @param {Record<string, EvidenceBoardDraft>} map @param {Record<string, EvidenceBoardDraft> | undefined} incoming */
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

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote */
export function mergeMemberEvidenceSourceMaps(local, remote) {
  return {
    ...(local?.evidenceBoardSourceByMember ?? {}),
    ...(remote?.evidenceBoardSourceByMember ?? {}),
  };
}
