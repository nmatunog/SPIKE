import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { buildFecEngineDraftFromCanvas } from './fecEngineDraft.js';

/**
 * Autosave hook — portfolio artifact + timeline only (does not overwrite FEC engine fields).
 * FEC Box 6/8 are updated via explicit submit on BusinessEngineFecEngineCard.
 * @param {string} participantId
 * @param {import('./types.js').BusinessEngineCanvasState} state
 */
export function syncBusinessEngineToFec(participantId, state) {
  if (!participantId) return;

  const weeklyRev = Number(state.weeklyTargets.revenue) || 0;
  const year1Rev = state.reflections.year1RevenueGoal || state.year1Targets.revenue || '';

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
    detail: `Weekly revenue ${weeklyRev ? `₱${weeklyRev.toLocaleString()}` : 'in progress'} · Year 1 ${year1Rev ? `₱${Number(year1Rev).toLocaleString()}` : 'pending'}`,
  });
}

/** Preview text for FEC card (re-export). */
export { buildFecEngineDraftFromCanvas };

/** @param {import('./types.js').BusinessEngineCanvasState} state */
function formatBusinessEngineArtifact(state) {
  const fecPreview = buildFecEngineDraftFromCanvas(state);
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
    '',
    '## FEC engine preview (submit card to sync)',
    fecPreview.advisorExcellence.slice(0, 200),
  ].join('\n');
}
