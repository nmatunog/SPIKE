import { setSectionField } from '../blueprintSectionStore.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { WEEK4_BLUEPRINT_SECTION_SLUG } from './missionConstants.js';

/**
 * @param {import('./types.js').Week4Day1MissionDrafts['blueprint']} draft
 */
export function finalizeBlueprintIntegration(participantId, draft) {
  const keyActivities = String(draft.keyActivities ?? '').trim();
  const keyResources = String(draft.keyResources ?? '').trim();

  if (!keyActivities || keyActivities.length < 20) return false;
  if (!keyResources || keyResources.length < 20) return false;

  setSectionField(participantId, WEEK4_BLUEPRINT_SECTION_SLUG, 'key_activities', keyActivities, {
    sourceType: 'week4_day1_mission',
    sourceId: 'blueprint-key-activities',
  });
  setSectionField(participantId, WEEK4_BLUEPRINT_SECTION_SLUG, 'key_resources', keyResources, {
    sourceType: 'week4_day1_mission',
    sourceId: 'blueprint-key-resources',
  });

  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-advisor-startup',
    title: 'Week 4 Blueprint — Key Activities & Resources',
    content: `## Key Activities\n${keyActivities}\n\n## Key Resources\n${keyResources}`,
    sourceType: 'week4_day1_mission',
    sourceId: 'blueprint-integration',
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'blueprint_updated',
    title: 'Blueprint Key Activities & Resources finalized',
    detail: 'Operational detail stored in Venture Blueprint (not FEC).',
    week: 4,
    day: 1,
  });
  return true;
}
