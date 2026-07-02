import { saveFecField } from '../fecCanvasService.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';

/**
 * Sync Financial Engine worksheet to FEC Box 8 (capture_value engine).
 * @param {string} participantId
 * @param {import('./types.js').FinancialEngineWorksheetState} state
 */
export function syncFinancialEngineToFec(participantId, state) {
  if (!participantId) return;

  const revenueModel = [
    state.revenueModel.streamsNarrative,
    '',
    '## Scaling trajectory',
    `Year 1: ₱${Number(state.scaling.year1Revenue || 0).toLocaleString()} · ${state.scaling.year1Clients} clients`,
    `Year 2: ₱${Number(state.scaling.year2Revenue || 0).toLocaleString()} · ${state.scaling.year2Clients} clients`,
    `Year 3: ₱${Number(state.scaling.year3Revenue || 0).toLocaleString()} · ${state.scaling.year3Clients} clients`,
  ].join('\n');

  saveFecField(participantId, 'capture_value', 'revenue_streams', revenueModel.trim());
  saveFecField(participantId, 'capture_value', 'cost_structure', state.economics.costStructureNarrative || '');
  saveFecField(
    participantId,
    'capture_value',
    'profit_formula',
    [state.sustainability.profitFormulaNarrative, '', state.scaling.scalingNarrative]
      .filter(Boolean)
      .join('\n\n'),
  );

  const summary = `Y1 ₱${Number(state.revenueModel.year1Revenue || 0).toLocaleString()} → Y3 ₱${Number(state.scaling.year3Revenue || 0).toLocaleString()}`;

  createPortfolioArtifactDraft(participantId, {
    title: 'Financial Engine Worksheet',
    sourceType: 'financial_engine_worksheet',
    sourceId: 'week-3-day-4',
    summary,
    bodyMarkdown: [revenueModel, state.economics.costStructureNarrative, state.sustainability.profitFormulaNarrative]
      .filter(Boolean)
      .join('\n\n---\n\n'),
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'financial_engine_updated',
    title: 'Financial Engine worksheet saved',
    detail: summary,
    week: 3,
    day: 4,
  });
}
