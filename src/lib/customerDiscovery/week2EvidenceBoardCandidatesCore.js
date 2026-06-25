/**
 * Shared helpers for evidence-board draft shapes.
 */

/**
 * @typedef {Object} EvidenceBoardDraft
 * @property {Array<{ text: string, count: number }>} [topGoals]
 * @property {Array<{ text: string, count: number }>} [topProblems]
 * @property {Array<{ text: string, count: number }>} [topOpportunities]
 * @property {string[]} [starredQuotes]
 * @property {string} [draftUpdatedAt]
 * @property {string} [draftBy]
 */

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
