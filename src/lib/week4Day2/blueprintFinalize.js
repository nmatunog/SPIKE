import { setSectionField } from '../blueprintSectionStore.js';
import { WEEK4_GROWTH_ENGINE_STAGES } from './missionConstants.js';

/**
 * Push stage redesign + leadership reflection into Blueprint Talent & Leadership Growth Engines.
 * @param {string} participantId
 * @param {import('./types.js').Week4Day2MissionDrafts} drafts
 */
export function finalizeWeek4Day2Blueprint(participantId, drafts) {
  const stage = WEEK4_GROWTH_ENGINE_STAGES.find((s) => s.id === drafts.mission2.stageId);
  const stageLabel = stage?.label ?? drafts.mission2.stageId;

  const talentBlock = [
    `5× Challenge: ${drafts.mission1.fiveXChallenge.trim()}`,
    '',
    `Redesigned Stage: ${stageLabel}`,
    `Bottleneck: ${drafts.mission2.bottleneck.trim()}`,
    `Solution: ${drafts.mission2.solution.trim()}`,
    `Expected Impact: ${drafts.mission2.expectedImpact.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');

  setSectionField(participantId, 'recruitment-growth', 'talent_development_system', talentBlock);

  if (drafts.mission3.leadershipMultiplier.trim()) {
    setSectionField(
      participantId,
      'leadership-growth',
      'growth_multipliers',
      drafts.mission3.leadershipMultiplier.trim(),
    );
  }

  return true;
}
