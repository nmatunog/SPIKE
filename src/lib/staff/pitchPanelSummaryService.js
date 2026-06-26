/**
 * Consolidated Week 2 pitch panel scores for coach squad views.
 */
import {
  PITCH_PANEL_DIMENSIONS,
  PITCH_PANEL_FEEDBACK_FIELDS,
  PITCH_PANEL_FEEDBACK_FALLBACK,
} from './pitchPanelConstants.js';
import {
  getSquadPitchPanelSnapshot,
  panelAverageToWeek2Xp,
} from './pitchPanelService.js';
import { fetchPitchPanelSquadFeedbackRemote } from '../supabase/pitchPanel.js';

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
 * @param {Array<{
 *   panelistName?: string,
 *   evidence?: number,
 *   validation?: number,
 *   presentation?: number,
 *   team?: number,
 *   keepFeedback?: string,
 *   improveFeedback?: string,
 *   exploreFeedback?: string,
 * }>} cards
 */
export function summarizePitchPanelCards(cards) {
  if (!cards?.length) return null;

  /** @type {Record<string, number | null>} */
  const dimensionAverages = {};
  for (const dim of PITCH_PANEL_DIMENSIONS) {
    const vals = cards
      .map((card) => Number(card[dim.id]))
      .filter((value) => Number.isFinite(value) && value > 0);
    dimensionAverages[dim.id] = vals.length
      ? Math.round((vals.reduce((sum, value) => sum + value, 0) / vals.length) * 10) / 10
      : null;
  }

  const dimVals = PITCH_PANEL_DIMENSIONS.flatMap((dim) => {
    const avg = dimensionAverages[dim.id];
    return avg != null && avg > 0 ? [avg] : [];
  });

  const cardAverages = cards
    .map((card) => {
      const vals = PITCH_PANEL_DIMENSIONS
        .map((dim) => Number(card[dim.id]))
        .filter((value) => Number.isFinite(value) && value > 0);
      return vals.length === PITCH_PANEL_DIMENSIONS.length
        ? vals.reduce((sum, value) => sum + value, 0) / vals.length
        : null;
    })
    .filter((value) => value != null);

  const panelAverage = cardAverages.length
    ? Math.round((cardAverages.reduce((sum, value) => sum + value, 0) / cardAverages.length) * 10) / 10
    : dimVals.length
      ? Math.round((dimVals.reduce((sum, value) => sum + value, 0) / dimVals.length) * 10) / 10
      : null;

  /** @type {Record<'keep' | 'improve' | 'explore', string[]>} */
  const feedbackSummary = { keep: [], improve: [], explore: [] };
  for (const field of PITCH_PANEL_FEEDBACK_FIELDS) {
    const key = `${field.id}Feedback`;
    const seen = new Set();
    for (const card of cards) {
      const text = String(card[key] ?? '').trim();
      if (!text || text === PITCH_PANEL_FEEDBACK_FALLBACK || seen.has(text)) continue;
      seen.add(text);
      feedbackSummary[field.id].push(text);
    }
  }

  return {
    panelAverage,
    dimensionAverages,
    panelistCount: cards.length,
    feedbackSummary,
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
      const remote = await fetchPitchPanelSquadFeedbackRemote(squadName);
      cards = Array.isArray(remote) ? remote : [];
      writeSquadCardsCache(squadName, cards);
    } catch {
      /* staff auth or network — use cache + snapshot */
    }
  }

  const fromCards = summarizePitchPanelCards(cards);
  const panelAverage = fromCards?.panelAverage ?? snapshot.panelAverage;
  const panelistCount = fromCards?.panelistCount ?? snapshot.panelistCount;

  return {
    squadName,
    panelAverage,
    dimensionAverages: fromCards?.dimensionAverages ?? null,
    feedbackSummary: fromCards?.feedbackSummary ?? { keep: [], improve: [], explore: [] },
    cards,
    panelistCount,
    week2PanelXp: snapshot.week2PanelXp,
    provisionalWeek2PanelXp: snapshot.provisionalWeek2PanelXp
      ?? (panelAverage ? panelAverageToWeek2Xp(panelAverage) : null),
    finalized: snapshot.finalized,
    pending: snapshot.pending,
    source: snapshot.source,
  };
}
