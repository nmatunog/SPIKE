import { saveFecField } from '../fecCanvasService.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';

/**
 * Sync Growth Engine worksheet to FEC Box 6 and portfolio artifact.
 * @param {string} participantId
 * @param {import('./types.js').GrowthEngineWorksheetState} state
 */
export function syncGrowthEngineToFec(participantId, state) {
  if (!participantId) return;

  const growthNarrative = [
    '## Growth Engine Canvas',
    '',
    `**Develop Leaders:** ${state.developLeaders || '—'}`,
    `**Build Systems:** ${state.buildSystems || '—'}`,
    `**Increase Capacity:** ${state.increaseCapacity || '—'}`,
    `**Expand Market:** ${state.expandMarket || '—'}`,
    `**Long-Term Vision:** ${state.longTermVision || '—'}`,
    '',
    '## Three-Year Growth Plan',
    '',
    `**Year 1 — Launch:** ${state.fecYear1Launch || '—'}`,
    `**Year 2 — Expand:** ${state.fecYear2Expand || '—'}`,
    `**Year 3 — Multiply:** ${state.fecYear3Multiply || '—'}`,
    '',
    '## Year 1 Targets',
    '',
    `Revenue Goal: ₱${Number(state.targets.yearRevenueGoal || 0).toLocaleString()}`,
    `Required Clients: ${state.targets.requiredClients || '—'}`,
    `Growth Strategy: ${state.growthStrategy || '—'}`,
  ].join('\n');

  saveFecField(participantId, 'agency_leadership', 'growth_multipliers', growthNarrative);
  saveFecField(participantId, 'agency_leadership', 'expansion_strategy', state.longTermVision || '');

  const weekly = state.targets.weeklyTargets ?? {};
  const monthly = state.targets.monthlyTargets ?? {};
  const revenueSummary = [
    `Year 1 Revenue: ₱${Number(state.targets.yearRevenueGoal || 0).toLocaleString()}`,
    `Clients Required: ${state.targets.requiredClients || '—'}`,
    `Weekly Prospects: ${weekly.prospects ?? '—'}`,
    `Monthly Revenue: ₱${Number(monthly.revenue || 0).toLocaleString()}`,
  ].join(' · ');

  saveFecField(participantId, 'capture_value', 'revenue_streams', revenueSummary);

  createPortfolioArtifactDraft(participantId, {
    title: 'Growth Engine Worksheet',
    sourceType: 'growth_engine_worksheet',
    sourceId: 'week-3-day-4',
    summary: `Year 1 target ₱${Number(state.targets.yearRevenueGoal || 0).toLocaleString()} · ${state.targets.requiredClients || '?'} clients`,
    bodyMarkdown: growthNarrative,
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'growth_engine_updated',
    title: 'Growth Engine worksheet saved',
    detail: revenueSummary,
    week: 3,
    day: 4,
  });
}
