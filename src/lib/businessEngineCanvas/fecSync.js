import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { saveFecField, saveFecSummaryField } from '../fecCanvasService.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { BUSINESS_LEVERS } from './constants.js';

/**
 * Sync Business Engine Canvas → FEC Box 6 (Growth Engines) & Box 8 (Financial Engine).
 * @param {string} participantId
 * @param {import('./types.js').BusinessEngineCanvasState} state
 */
export function syncBusinessEngineToFec(participantId, state) {
  if (!participantId) return;

  const leverLabel = BUSINESS_LEVERS.find((l) => l.id === state.businessLever)?.label ?? 'Not selected';
  const weeklyRev = Number(state.weeklyTargets.revenue) || 0;
  const monthlyRev = Number(state.monthlyTargets.revenue) || weeklyRev * 4;
  const year1Rev = state.reflections.year1RevenueGoal || state.year1Targets.revenue || '';

  const advisorExcellence = [
    `Activity Engine: ${state.activityEngine.prospects?.value ?? 10} prospects → ${state.activityEngine.clients?.value ?? 1} new client/week`,
    `Weekly revenue target: ₱${weeklyRev.toLocaleString()}`,
    `Primary lever: ${leverLabel}`,
    state.reflections.firstImprovement ? `First improvement: ${state.reflections.firstImprovement}` : '',
  ].filter(Boolean).join('\n');

  const systemsScale = [
    `Monthly projection: ₱${monthlyRev.toLocaleString()} revenue`,
    state.reflections.biggestWeakness ? `Engine weakness: ${state.reflections.biggestWeakness}` : '',
    state.reflections.engineProducesBusiness ? `Engine fit: ${state.reflections.engineProducesBusiness}` : '',
  ].filter(Boolean).join('\n');

  const revenueModel = [
    `Weekly: ₱${weeklyRev.toLocaleString()} · Monthly: ₱${monthlyRev.toLocaleString()}`,
    year1Rev ? `Year 1 commitment: ₱${year1Rev}` : '',
    `Per-client revenue: ₱${Number(state.activityEngine.revenue?.value ?? 10000).toLocaleString()}`,
  ].filter(Boolean).join('\n');

  saveFecField(participantId, 'create_value', 'value_offering', advisorExcellence.slice(0, 500));
  saveFecField(participantId, 'agency_leadership', 'growth_multipliers', systemsScale.slice(0, 500));
  saveFecField(participantId, 'capture_value', 'revenue_streams', revenueModel.slice(0, 500));

  if (year1Rev) {
    saveFecSummaryField(participantId, {
      year1_goal: `Year 1 revenue target: ₱${year1Rev} (Business Engine Canvas)`,
    });
  }

  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-advisor-startup',
    title: 'SPIKE Business Engine Canvas™',
    content: formatBusinessEngineArtifact(state),
    sourceType: 'business_engine_canvas',
    sourceId: 'week-3-day-3',
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'business_engine_canvas',
    title: 'Business Engine Canvas updated',
    detail: `Weekly revenue ₱${weeklyRev.toLocaleString()} · ${computeProgressLabel(state)} complete`,
  });
}

/** @param {import('./types.js').BusinessEngineCanvasState} state */
function formatBusinessEngineArtifact(state) {
  return [
    '# SPIKE Business Engine Canvas™',
    '',
    '## Activity Engine (Weekly)',
    `- Prospects: ${state.activityEngine.prospects?.value}`,
    `- Discovery: ${state.activityEngine.discovery?.value}`,
    `- Presentations: ${state.activityEngine.presentations?.value}`,
    `- New Clients: ${state.activityEngine.clients?.value}`,
    `- Revenue: ₱${state.activityEngine.revenue?.value}`,
    `- Referrals: ${state.activityEngine.referrals?.value}`,
    '',
    '## Year 1 Revenue Commitment',
    state.reflections.year1RevenueGoal ? `₱${state.reflections.year1RevenueGoal}` : '_Pending_',
    '',
    '## Reflection',
    state.reflections.engineProducesBusiness || '_Pending_',
  ].join('\n');
}

/** @param {import('./types.js').BusinessEngineCanvasState} state */
function computeProgressLabel(state) {
  const pct = Math.round(
    (Object.values(state.weeklyTargets).filter((v) => v !== '' && v != null).length / 6) * 100,
  );
  return `${pct}%`;
}
