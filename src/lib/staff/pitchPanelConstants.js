/** Segment 1 pitch panel — Venture Capital investment simulation (live session: Week 5 Execute). */

/** Bump this for each live Demo Day so browser/local caches and cloud rows stay isolated. */
export const PITCH_PANEL_SESSION_ID = 'segment-1-2026-07-15';
/** Guest PIN (unchanged mid-session so panelists keep access). */
export const PITCH_PANEL_ACCESS_PIN = 'W2PITCH';
/** Program week this pitch session awards XP against. */
export const PITCH_PANEL_WEEK = 5;
/** Coach-facing labels for the live pitch (do not change PIN mid-event). */
export const PITCH_PANEL_LABEL_WEEK = 'Week 5';
export const PITCH_PANEL_LABEL_XP = 'Week 5 XP';
export const PITCH_PANEL_LABEL_XP_SHORT = 'W5 XP';

/** Each panelist receives ₱1M SPIKE Venture Capital. */
export const PITCH_PANEL_CAPITAL = 1_000_000;

/** Custom amounts must be in ₱10,000 increments. */
export const PITCH_PANEL_INVESTMENT_INCREMENT = 10_000;

/** Quick-select investment amounts. */
export const PITCH_PANEL_INVESTMENT_PRESETS = [0, 50_000, 100_000, 250_000, 500_000, 750_000, 1_000_000];

/** Optional reason for investment (max chars). */
export const PITCH_PANEL_COMMENT_MAX_CHARS = 100;

/** Investment criteria shown to panelists (not scored). */
export const PITCH_PANEL_INVESTMENT_CRITERIA = [
  'Confidence in the team and venture',
  'Scalability of the business model',
  'Business viability and market proof',
  'Growth potential over 3 years',
  'Presentation quality and clarity',
];

export const PITCH_PANEL_LIVE_STORAGE_KEY = 'spike_pitch_panel_live_v1';
export const PITCH_PANEL_FINAL_STORAGE_KEY = 'spike_pitch_panel_final_v1';
export const PITCH_PANEL_TOKEN_STORAGE_KEY = 'spike_pitch_panel_token_v1';
export const PITCH_PANEL_INVESTMENTS_CACHE_KEY = 'spike_pitch_panel_investments_v1';
export const PITCH_PANEL_COACH_OVERRIDES_KEY = 'spike_pitch_panel_coach_overrides_v1';
export const PITCH_PANEL_COACH_MATRIX_CACHE_KEY = 'spike_pitch_panel_coach_matrix_v1';

/** Pitch order for Demo Day (Segment 1 cohort). */
export const PITCH_PANEL_SQUAD_ORDER = ['Cassiopeia', 'Pegasus', 'Argo Navis'];

/** @param {string[]} names */
export function sortPitchPanelSquads(names) {
  const rank = new Map(PITCH_PANEL_SQUAD_ORDER.map((name, index) => [name.toLowerCase(), index]));
  return [...names].sort((a, b) => {
    const aRank = rank.get(a.toLowerCase()) ?? 999;
    const bRank = rank.get(b.toLowerCase()) ?? 999;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
}

/** @param {number} n */
export function formatPitchPeso(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₱0';
  return `₱${v.toLocaleString()}`;
}

/** @param {number} amount */
export function isValidInvestmentIncrement(amount) {
  const v = Number(amount);
  return Number.isFinite(v) && v >= 0 && v <= PITCH_PANEL_CAPITAL && v % PITCH_PANEL_INVESTMENT_INCREMENT === 0;
}

/**
 * @param {Record<string, number>} allocations squadName → amount
 */
export function computeRemainingCapital(allocations) {
  const total = Object.values(allocations).reduce((sum, n) => sum + (Number(n) || 0), 0);
  return Math.max(0, PITCH_PANEL_CAPITAL - total);
}

/**
 * @param {Array<{ squadName: string, totalInvestment?: number, finalInvestment?: number }>} rows
 */
export function buildInvestmentLeaderboard(rows) {
  return [...rows]
    .map((r) => ({
      squadName: r.squadName,
      totalInvestment: Number(r.finalInvestment ?? r.totalInvestment ?? 0),
    }))
    .sort((a, b) => b.totalInvestment - a.totalInvestment);
}

/**
 * Detect tied leaders for tiebreaker.
 * @param {Array<{ squadName: string, totalInvestment: number }>} leaderboard
 */
export function detectInvestmentTie(leaderboard) {
  if (leaderboard.length < 2) return null;
  const top = leaderboard[0].totalInvestment;
  if (top <= 0) return null;
  const tied = leaderboard.filter((r) => r.totalInvestment === top);
  return tied.length > 1 ? tied.map((r) => r.squadName) : null;
}

/** Rank-based panel XP (investment winner model). */
export const PITCH_PANEL_RANK_XP = [20, 13, 7];

/**
 * @param {number} rank 1-based
 * @param {number} [squadCount]
 */
export function investmentRankToWeek2Xp(rank, squadCount = 3) {
  if (!rank || rank < 1) return 0;
  if (rank <= PITCH_PANEL_RANK_XP.length) return PITCH_PANEL_RANK_XP[rank - 1];
  return Math.max(0, Math.round((squadCount - rank + 1) / squadCount * 7));
}
