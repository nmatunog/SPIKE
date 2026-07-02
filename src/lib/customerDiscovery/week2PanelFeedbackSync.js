/**
 * Sync guest panelist investments → each intern's Week 2 Day 5 portfolio.
 */
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { setSectionField } from '../blueprintSectionStore.js';
import { getParticipantSquad } from '../cohortFormationService.js';
import { formatPitchPeso } from '../staff/pitchPanelConstants.js';
import { fetchPitchPanelSquadInvestmentsRemote } from '../supabase/pitchPanel.js';

const SOURCE_ID = 'panelist-investments-week2-day5';
const CARDS_CACHE_KEY = 'spike_pitch_panel_investments_cards_v1';

/** @param {string} participantId @param {Array<object>} cards */
function cacheInvestmentCards(participantId, cards) {
  try {
    const all = JSON.parse(localStorage.getItem(CARDS_CACHE_KEY) || '{}');
    all[participantId] = { cards, updatedAt: new Date().toISOString() };
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** @param {string} participantId */
export function loadPanelInvestmentCards(participantId) {
  try {
    return JSON.parse(localStorage.getItem(CARDS_CACHE_KEY) || '{}')[participantId]?.cards ?? [];
  } catch {
    return [];
  }
}

/** @deprecated */
export function loadPanelFeedbackCards(participantId) {
  return loadPanelInvestmentCards(participantId);
}

/**
 * @param {string} squadName
 * @param {Array<{ panelistName: string, panelistOrg?: string, amount: number, comment?: string, isFinal?: boolean }>} cards
 */
export function buildPanelInvestmentMarkdown(squadName, cards) {
  if (!cards.length) {
    return `# Demo Day funding — Week 2 · Day 5\n\n**Squad:** ${squadName}\n\n_No panelist investments finalized yet._`;
  }

  const total = cards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const rows = cards.map(
    (c) =>
      `| ${c.panelistName}${c.panelistOrg?.trim() ? ` (${c.panelistOrg.trim()})` : ''} | ${formatPitchPeso(c.amount)} |`,
  );

  return [
    '# Demo Day funding — Week 2 · Day 5',
    '',
    `**Squad:** ${squadName}`,
    `**Total investment received:** ${formatPitchPeso(total)}`,
    '',
    '| Panelist | Investment |',
    '| --- | --- |',
    ...rows,
    '',
    ...cards
      .filter((c) => c.comment?.trim())
      .map((c) => `- **${c.panelistName}:** ${c.comment}`),
  ].join('\n');
}

/** @deprecated */
export function buildPanelFeedbackMarkdown(squadName, cards) {
  return buildPanelInvestmentMarkdown(squadName, cards);
}

/**
 * @param {string} participantId
 * @param {Array<object>} cards
 * @param {string} squadName
 */
export function writePanelInvestmentsToPortfolio(participantId, squadName, cards) {
  const content = buildPanelInvestmentMarkdown(squadName, cards);
  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-market-intelligence',
    title: 'Demo Day funding · Week 2 Day 5',
    content,
    sourceType: 'pitch-panel-investments',
    sourceId: SOURCE_ID,
  });
  setSectionField(participantId, 'market-intelligence', 'panelist_pitch_feedback', content, {
    sourceType: 'pitch-panel-investments',
    sourceId: SOURCE_ID,
  });
  cacheInvestmentCards(participantId, cards);
}

/** @deprecated */
export function writePanelFeedbackToPortfolio(participantId, squadName, cards) {
  writePanelInvestmentsToPortfolio(participantId, squadName, cards);
}

/** @param {string} participantId */
export async function syncPitchPanelFeedbackToPortfolio(participantId) {
  const squad = getParticipantSquad(participantId);
  if (!squad?.name) return;
  try {
    const cards = await fetchPitchPanelSquadInvestmentsRemote(squad.name);
    if (cards.length) {
      writePanelInvestmentsToPortfolio(participantId, squad.name, cards);
    }
  } catch {
    /* offline */
  }
}
