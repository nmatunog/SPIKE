/**
 * Consolidated Week 2 Demo Day investments for coach squad views.
 */
import { formatPitchPeso, investmentRankToWeek2Xp } from './pitchPanelConstants.js';
import { getSquadPitchPanelSnapshot } from './pitchPanelService.js';
import { fetchPitchPanelSquadInvestmentsRemote } from '../supabase/pitchPanel.js';

const SQUAD_CARDS_CACHE_KEY = 'spike_pitch_panel_squad_cards_v1';

/** @param {string} squadName */
function readSquadCardsCache(squadName) {
  try {
    return JSON.parse(localStorage.getItem(SQUAD_CARDS_CACHE_KEY) || '{}')[squadName]?.cards ?? [];
  } catch {
    return [];
  }
}

/** @param {string} squadName @param {object[]} cards */
function writeSquadCardsCache(squadName, cards) {
  try {
    const all = JSON.parse(localStorage.getItem(SQUAD_CARDS_CACHE_KEY) || '{}');
    all[squadName] = { cards, updatedAt: new Date().toISOString() };
    localStorage.setItem(SQUAD_CARDS_CACHE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * @param {Array<{ panelistName?: string, amount?: number, comment?: string }>} cards
 */
export function summarizePitchPanelCards(cards) {
  if (!cards?.length) return null;

  const totalInvestment = cards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const comments = cards
    .map((c) => String(c.comment ?? '').trim())
    .filter(Boolean);

  return {
    totalInvestment,
    panelAverage: null,
    dimensionAverages: null,
    panelistCount: cards.length,
    feedbackSummary: { comments },
  };
}

/**
 * @param {string} squadName
 * @param {string[]} memberIds
 * @param {{ fetchCards?: boolean }} [options]
 */
export async function loadSquadPitchPanelSummary(squadName, memberIds, options = {}) {
  const snapshot = getSquadPitchPanelSnapshot(squadName, memberIds);
  let cards = readSquadCardsCache(squadName);

  if (options.fetchCards) {
    try {
      const remote = await fetchPitchPanelSquadInvestmentsRemote(squadName);
      cards = Array.isArray(remote) ? remote : [];
      writeSquadCardsCache(squadName, cards);
    } catch {
      /* staff auth or network */
    }
  }

  const fromCards = summarizePitchPanelCards(cards);
  const totalInvestment = fromCards?.totalInvestment ?? snapshot.totalInvestment ?? 0;
  const panelistCount = fromCards?.panelistCount ?? snapshot.panelistCount;

  return {
    squadName,
    totalInvestment,
    panelAverage: snapshot.panelAverage,
    dimensionAverages: null,
    feedbackSummary: fromCards?.feedbackSummary ?? { comments: [] },
    cards,
    panelistCount,
    week2PanelXp: snapshot.week2PanelXp,
    provisionalWeek2PanelXp: snapshot.pending ? investmentRankToWeek2Xp(2) : null,
    finalized: snapshot.finalized,
    pending: snapshot.pending,
    source: snapshot.source,
    rank: snapshot.rank,
    formattedTotal: formatPitchPeso(totalInvestment),
  };
}
