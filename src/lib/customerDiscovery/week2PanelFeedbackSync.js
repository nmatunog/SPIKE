/**
 * Sync guest panelist score cards → each intern's Week 2 Day 5 portfolio.
 */
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { setSectionField } from '../blueprintSectionStore.js';
import { getParticipantSquad } from '../cohortFormationService.js';
import { PITCH_PANEL_DIMENSIONS } from '../staff/pitchPanelConstants.js';
import { fetchPitchPanelSquadFeedbackRemote } from '../supabase/pitchPanel.js';

const SOURCE_ID = 'panelist-feedback-week2-day5';
const CARDS_CACHE_KEY = 'spike_pitch_panel_feedback_cards_v1';

/** @param {string} participantId @param {Parameters<typeof buildPanelFeedbackMarkdown>[1]} cards */
function cachePanelFeedbackCards(participantId, cards) {
  try {
    const all = JSON.parse(localStorage.getItem(CARDS_CACHE_KEY) || '{}');
    all[participantId] = { cards, updatedAt: new Date().toISOString() };
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** @param {string} participantId */
export function loadPanelFeedbackCards(participantId) {
  try {
    return JSON.parse(localStorage.getItem(CARDS_CACHE_KEY) || '{}')[participantId]?.cards ?? [];
  } catch {
    return [];
  }
}

/**
 * @param {string} squadName
 * @param {Array<{
 *   panelistName: string,
 *   panelistOrg?: string,
 *   evidence: number,
 *   validation: number,
 *   presentation: number,
 *   team: number,
 *   keepFeedback: string,
 *   improveFeedback: string,
 *   exploreFeedback: string,
 *   submittedAt?: string,
 * }>} cards
 */
export function buildPanelFeedbackMarkdown(squadName, cards) {
  if (!cards.length) {
    return `# Panelist feedback — Week 2 · Day 5\n\n**Squad:** ${squadName}\n\n_No panelist score cards submitted yet._`;
  }

  const dimLabels = Object.fromEntries(PITCH_PANEL_DIMENSIONS.map((d) => [d.id, d.label]));

  const blocks = cards.map((card) => {
    const org = card.panelistOrg?.trim() ? ` (${card.panelistOrg.trim()})` : '';
    const scores = [
      `${dimLabels.evidence} ${card.evidence}`,
      `${dimLabels.validation} ${card.validation}`,
      `${dimLabels.presentation} ${card.presentation}`,
      `${dimLabels.team} ${card.team}`,
    ].join(' · ');
    return [
      `## ${card.panelistName}${org}`,
      `**Scores:** ${scores}`,
      '',
      `- **Keep:** ${card.keepFeedback}`,
      `- **Improve:** ${card.improveFeedback}`,
      `- **Explore:** ${card.exploreFeedback}`,
    ].join('\n');
  });

  return [
    '# Panelist feedback — Week 2 · Day 5 Validate',
    '',
    `**Squad:** ${squadName}`,
    '',
    ...blocks,
  ].join('\n');
}

/**
 * @param {string} participantId
 * @param {Array<Parameters<typeof buildPanelFeedbackMarkdown>[1][number]>} cards
 * @param {string} squadName
 */
export function writePanelFeedbackToPortfolio(participantId, squadName, cards) {
  const content = buildPanelFeedbackMarkdown(squadName, cards);
  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-market-intelligence',
    title: 'Panelist feedback · Week 2 Day 5',
    content,
    sourceType: 'pitch-panel-feedback',
    sourceId: SOURCE_ID,
  });
  setSectionField(participantId, 'market-intelligence', 'panelist_pitch_feedback', content, {
    sourceType: 'pitch-panel-feedback',
    sourceId: SOURCE_ID,
  });
  return content;
}

/** @param {string} participantId */
export async function syncPitchPanelFeedbackToPortfolio(participantId) {
  const squad = getParticipantSquad(participantId);
  const squadName = squad?.name?.trim();
  if (!squadName) return { synced: false, reason: 'no_squad' };

  try {
    const cards = await fetchPitchPanelSquadFeedbackRemote(squadName);
    writePanelFeedbackToPortfolio(participantId, squadName, cards);
    cachePanelFeedbackCards(participantId, cards);
    return { synced: true, count: cards.length };
  } catch (err) {
    console.warn('[week2PanelFeedback] sync failed', err);
    return { synced: false, reason: err instanceof Error ? err.message : 'error' };
  }
}
