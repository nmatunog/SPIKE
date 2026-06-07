/**
 * Market Intelligence — aggregates survey data into Blueprint section (Sprint 05).
 */
import { countSubmittedSurveys, getSurveyResponseLocal } from './surveyService.js';
import { setSectionField, getSectionFields } from './blueprintSectionStore.js';
import { listPortfolioArtifacts } from './blueprintArtifacts.js';

/** @param {string} participantId */
export function getMarketIntelligenceSummary(participantId) {
  const fields = getSectionFields(participantId, 'market-intelligence');
  const surveyCount = countSubmittedSurveys(participantId);
  const artifacts = listPortfolioArtifacts(participantId, 'portfolio-market-intelligence');

  return {
    surveyCount: Number(fields.survey_count) || surveyCount,
    researchFindings: fields.research_findings || '',
    marketSegmentInsights: fields.market_segment_insights || '',
    opportunityNotes: fields.opportunity_notes || '',
    artifacts,
  };
}

/**
 * @param {string} participantId
 * @param {string} surveyId
 * @param {string} formattedAnswers
 * @param {string} [surveyTitle]
 */
export function syncSurveyToMarketIntelligence(participantId, surveyId, formattedAnswers, surveyTitle) {
  const count = countSubmittedSurveys(participantId);
  setSectionField(participantId, 'market-intelligence', 'survey_count', String(count), {
    sourceType: 'survey',
    sourceId: surveyId,
  });

  const block = [
    surveyTitle ? `Survey: ${surveyTitle}` : `Survey ${surveyId}`,
    formattedAnswers,
  ].join('\n\n');

  setSectionField(participantId, 'market-intelligence', 'research_findings', block, {
    append: true,
    sourceType: 'survey',
    sourceId: surveyId,
  });

  // Extract open-text / ranking answers into opportunity notes
  const local = getSurveyResponseLocal(participantId, surveyId);
  if (local?.answers) {
    const insights = Object.entries(local.answers)
      .filter(([, v]) => typeof v === 'string' && v.trim().length > 10)
      .map(([, v]) => String(v).trim())
      .join('\n');
    if (insights) {
      setSectionField(participantId, 'market-intelligence', 'opportunity_notes', insights, {
        append: true,
        sourceType: 'survey',
        sourceId: surveyId,
      });
    }
  }
}

/** @param {string} participantId */
export function computeMarketIntelligenceCompletionPct(participantId) {
  const s = getMarketIntelligenceSummary(participantId);
  let score = 0;
  if (s.surveyCount > 0) score += 25;
  if (s.researchFindings.trim().length >= 30) score += 25;
  if (s.marketSegmentInsights.trim().length >= 30) score += 25;
  if (s.opportunityNotes.trim().length >= 20) score += 25;
  return score;
}
