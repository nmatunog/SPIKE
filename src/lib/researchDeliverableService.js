/**
 * Auto-generate research deliverables → Market Intelligence (Sprint 05b).
 */
import { createPortfolioArtifactDraft } from './blueprintArtifacts.js';
import { setSectionField } from './blueprintSectionStore.js';
import { RESEARCH_DELIVERABLES } from './researchSeeds.js';
import {
  getSquadAnalytics,
  buildPersonasFromAnalytics,
  buildOpportunityMap,
  extractTrends,
} from './researchAnalyticsService.js';

const PORTFOLIO_SECTION = 'portfolio-market-intelligence';

/**
 * @param {string} participantId
 * @param {string} squadId
 * @param {string} surveyId
 * @param {string} surveyTitle
 * @param {string} marketSegmentLabel
 */
export async function generateResearchDeliverables(
  participantId,
  squadId,
  surveyId,
  surveyTitle,
  marketSegmentLabel,
) {
  const analytics = await getSquadAnalytics(squadId, surveyId);
  if (!analytics) return [];

  const trends = extractTrends(analytics);
  const personas = buildPersonasFromAnalytics(analytics, marketSegmentLabel);
  const opportunities = buildOpportunityMap(analytics);

  const deliverables = [];

  const surveyResults = [
    `# ${surveyTitle} — Squad Results`,
    `Responses: ${analytics.responseCount}`,
    '',
    ...trends.map((t) => `• ${t.prompt}: ${t.value} (${t.detail})`),
  ].join('\n');

  deliverables.push(
    saveDeliverable(participantId, 'Survey Results', surveyResults, surveyId),
  );

  const personaBlock = personas
    .map(
      (p) =>
        `## ${p.name}\nSegment: ${p.segment}\nCareer lean: ${p.careerLean}\nFocus: ${p.topFocus}\nPriority: ${p.topPriority}\nPain point: ${p.painPoints}\nGoal: ${p.goals}`,
    )
    .join('\n\n');

  deliverables.push(
    saveDeliverable(participantId, 'Customer Personas', personaBlock, `${surveyId}-personas`),
  );

  const oppBlock = opportunities
    .map((o) => `• ${o.area} — ${o.signal} (strength ${o.strength})`)
    .join('\n');

  deliverables.push(
    saveDeliverable(participantId, 'Opportunity Maps', oppBlock || 'No opportunities mapped yet.', `${surveyId}-opportunities`),
  );

  const reportDraft = [
    `# Research Report Draft — ${marketSegmentLabel}`,
    '',
    '## Key trends',
    ...trends.map((t) => `- ${t.prompt}: ${t.value}`),
    '',
    '## Personas',
    personaBlock,
    '',
    '## Opportunities',
    oppBlock,
  ].join('\n');

  deliverables.push(
    saveDeliverable(participantId, 'Research Reports', reportDraft, `${surveyId}-report`),
  );

  const deckOutline = [
    `# Presentation Deck Inputs — ${surveyTitle}`,
    '1. Squad segment & hypothesis',
    `2. ${analytics.responseCount} survey responses`,
    '3. Top trends',
    ...trends.slice(0, 4).map((t, i) => `   ${i + 1}. ${t.prompt}`),
    '4. Persona snapshot',
    `5. ${personas[0]?.name ?? 'Primary persona'}`,
    '6. Opportunity map',
  ].join('\n');

  deliverables.push(
    saveDeliverable(participantId, 'Presentation Decks', deckOutline, `${surveyId}-deck`),
  );

  syncToMarketIntelligence(participantId, surveyId, {
    surveyResults,
    personaBlock,
    oppBlock,
    marketSegmentLabel,
    responseCount: analytics.responseCount,
  });

  return deliverables;
}

/**
 * @param {string} participantId
 * @param {string} title
 * @param {string} content
 * @param {string} sourceId
 */
function saveDeliverable(participantId, title, content, sourceId) {
  if (!RESEARCH_DELIVERABLES.includes(title)) return null;
  return createPortfolioArtifactDraft({
    participantId,
    sectionId: PORTFOLIO_SECTION,
    title,
    content,
    sourceType: 'research_squad',
    sourceId,
  });
}

/**
 * @param {string} participantId
 * @param {string} surveyId
 * @param {object} blocks
 */
function syncToMarketIntelligence(participantId, surveyId, blocks) {
  setSectionField(
    participantId,
    'market-intelligence',
    'research_findings',
    blocks.surveyResults,
    { append: true, sourceType: 'research_squad', sourceId: surveyId },
  );

  setSectionField(
    participantId,
    'market-intelligence',
    'market_segment_insights',
    `Segment: ${blocks.marketSegmentLabel}\n\n${blocks.personaBlock}`,
    { sourceType: 'research_squad', sourceId: `${surveyId}-personas` },
  );

  setSectionField(
    participantId,
    'market-intelligence',
    'opportunity_notes',
    blocks.oppBlock,
    { sourceType: 'research_squad', sourceId: `${surveyId}-opportunities` },
  );

  setSectionField(
    participantId,
    'market-intelligence',
    'survey_count',
    String(blocks.responseCount),
    { sourceType: 'research_squad', sourceId: surveyId },
  );
}
