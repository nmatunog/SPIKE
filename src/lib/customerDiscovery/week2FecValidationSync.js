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

/** @param {Record<string, unknown>} board */
function evidenceBoardDraftAt(board) {
  return String(board?.draftUpdatedAt ?? '');
}

/** @param {Array<{ text?: string, count?: number }> | undefined} rows */
function rankedSectionFilledCount(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => String(row?.text ?? '').trim()).length;
}

/** @param {Record<string, unknown>} board */
function evidenceBoardFilledScore(board) {
  const sections = [board?.topGoals, board?.topProblems, board?.topOpportunities];
  return sections.reduce((n, rows) => n + rankedSectionFilledCount(rows), 0);
}

/** @param {Array<{ text?: string, count?: number }> | undefined} rows @param {number} limit */
function padRanked(rows, limit = 3) {
  const out = (Array.isArray(rows) ? rows : []).slice(0, limit).map((row) => ({
    text: String(row?.text ?? ''),
    count: Number(row?.count ?? 0) || 0,
  }));
  while (out.length < limit) out.push({ text: '', count: 0 });
  return out;
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
function mergeRankedSlotsBySlot(a, b, limit = 3) {
  const left = padRanked(a, limit);
  const right = padRanked(b, limit);
  return left.map((slot, index) => pickRicherRankedSlot(slot, right[index]));
}

/** @param {string[] | undefined} a @param {string[] | undefined} b */
function mergeStarredQuotes(a, b) {
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

/** @param {Record<string, string> | undefined} a @param {Record<string, string> | undefined} b */
function mergeMarketSummary(a, b) {
  const left = a ?? {};
  const right = b ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of keys) {
    const textA = String(left[key] ?? '').trim();
    const textB = String(right[key] ?? '').trim();
    if (!textA) out[key] = textB;
    else if (!textB) out[key] = textA;
    else out[key] = textB.length > textA.length ? textB : textA;
  }
  return out;
}

/** @param {Record<string, unknown>} board */
function evidenceBoardRichnessMeta(board) {
  return {
    score: evidenceBoardFilledScore(board),
    chars:
      rankedSectionCharCount(board?.topGoals)
      + rankedSectionCharCount(board?.topProblems)
      + rankedSectionCharCount(board?.topOpportunities),
    starred: Array.isArray(board?.starredQuotes) ? board.starredQuotes.filter(Boolean).length : 0,
    at: evidenceBoardDraftAt(board),
    by: board?.draftBy,
  };
}

/** @param {Array<{ text?: string }> | undefined} rows */
function rankedSectionCharCount(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((n, row) => n + String(row?.text ?? '').trim().length, 0);
}

/** @param {Record<string, unknown>} localBoard @param {Record<string, unknown>} remoteBoard */
function mergeEvidenceBoardDraft(localBoard, remoteBoard) {
  const local = localBoard ?? {};
  const remote = remoteBoard ?? {};

  const topGoals = mergeRankedSlotsBySlot(local.topGoals, remote.topGoals);
  const topProblems = mergeRankedSlotsBySlot(local.topProblems, remote.topProblems);
  const topOpportunities = mergeRankedSlotsBySlot(local.topOpportunities, remote.topOpportunities);
  const starredQuotes = mergeStarredQuotes(
    /** @type {string[] | undefined} */ (local.starredQuotes),
    /** @type {string[] | undefined} */ (remote.starredQuotes),
  );
  const marketSummary = mergeMarketSummary(
    /** @type {Record<string, string> | undefined} */ (local.marketSummary),
    /** @type {Record<string, string> | undefined} */ (remote.marketSummary),
  );

  const localMeta = evidenceBoardRichnessMeta(local);
  const remoteMeta = evidenceBoardRichnessMeta(remote);
  const richer =
    remoteMeta.score > localMeta.score
    || (remoteMeta.score === localMeta.score && remoteMeta.chars > localMeta.chars)
    || (remoteMeta.score === localMeta.score && remoteMeta.chars === localMeta.chars && remoteMeta.starred > localMeta.starred)
      ? remoteMeta
      : localMeta;

  return {
    ...local,
    ...remote,
    marketSummary,
    topGoals,
    topProblems,
    topOpportunities,
    starredQuotes,
    draftUpdatedAt: richer.at || localMeta.at || remoteMeta.at,
    draftBy: richer.by,
  };
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

  return {
    ...base,
    boxScores: { ...(local.boxScores ?? {}), ...(remote.boxScores ?? {}), ...(base.boxScores ?? {}) },
    steps: { ...(local.steps ?? {}), ...(remote.steps ?? {}) },
    squadRoles: { ...(local.squadRoles ?? {}), ...(remote.squadRoles ?? {}) },
    pitchSlides: { ...(local.pitchSlides ?? {}), ...(remote.pitchSlides ?? {}) },
    evidenceBoard: mergeEvidenceBoardDraft(local.evidenceBoard, remote.evidenceBoard),
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
      evidenceBoard: mergeEvidenceBoardDraft(merged.evidenceBoard, local.evidenceBoard),
      updatedAt: localAt,
    });
  }

  return saveFecValidation(key, merged);
}

/**
 * Pull squad FEC state from any member's cloud copy — merges richest evidence-board drafts.
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
      evidenceBoard: mergeEvidenceBoardDraft(merged.evidenceBoard, local.evidenceBoard),
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
