/**
 * Auto-sync Week 2 Day 1 Customer Discovery prep → Portfolio & Blueprint.
 */
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { setSectionField } from '../blueprintSectionStore.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { resolveSquadMission, WEEK2_COHORT_NAME } from './week2Constants.js';
import { getCoachSummaryForMentor } from '../ventureCoachService.js';

/** @param {string} participantId @param {string} [squadName] */
export function syncWeek2Day1Portfolio(participantId, squadName = '') {
  const state = loadWeek2Discovery(participantId);
  if (state.portfolioSyncedAt) return state;

  const mission = resolveSquadMission(squadName);
  const coach = getCoachSummaryForMentor(participantId);
  const questions = (state.questions ?? [])
    .map((q, i) => `${i + 1}. ${q.text}`)
    .join('\n');
  const assumptions = (state.assumptions ?? [])
    .map((a) => `• ${a.belief ?? a.text ?? ''}`)
    .join('\n');
  const reflection = (state.thinkingShifts ?? [])[0]?.response ?? '';

  const preparedAt = new Date().toISOString().slice(0, 10);

  const artifactBody = [
    `# Week 2 Day 1 — Customer Discovery Preparation`,
    '',
    `**Cohort:** ${WEEK2_COHORT_NAME}`,
    `**Squad:** ${mission.squadKey}`,
    `**Customer Segment:** ${mission.marketSegment}`,
    '',
    '## Mission',
    mission.mission,
    '',
    '## Research Objectives',
    ...mission.objectives.map((o) => `- ${o}`),
    '',
    '## Five Interview Questions',
    questions || '_Questions in progress_',
    '',
    '## Assumptions',
    assumptions || '_None recorded yet_',
    '',
    '## Reflection',
    reflection || '_Pending_',
    '',
    `**Prepared:** ${preparedAt}`,
  ].join('\n');

  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-market-intelligence',
    title: 'Customer Discovery Preparation',
    content: artifactBody,
    sourceType: 'week2-discovery',
    sourceId: 'day1-prep',
  });

  setSectionField(participantId, 'market-intelligence', 'customer_discovery_prep', artifactBody, {
    sourceType: 'week2-discovery',
    sourceId: 'day1-prep',
  });

  setSectionField(participantId, 'market-intelligence', 'assigned_squad', mission.squadKey, {
    sourceType: 'week2-discovery',
  });

  setSectionField(participantId, 'market-intelligence', 'customer_segment', mission.marketSegment, {
    sourceType: 'week2-discovery',
  });

  setSectionField(
    participantId,
    'market-intelligence',
    'interview_questions',
    questions,
    { sourceType: 'week2-discovery' },
  );

  if (coach?.ambition) {
    setSectionField(participantId, 'market-intelligence', 'dream_connection', coach.ambition, {
      sourceType: 'week2-discovery',
    });
  }

  appendBlueprintTimelineEvent(participantId, {
    type: 'week2_discovery',
    title: 'Week 2 · Customer Discovery Preparation saved',
    module: 'customer-discovery',
    sourceType: 'week2-discovery',
    sourceId: 'day1-prep',
  });

  return saveWeek2Discovery(participantId, { portfolioSyncedAt: new Date().toISOString() });
}

/** @param {string} participantId */
export function isWeek2PortfolioSynced(participantId) {
  return Boolean(loadWeek2Discovery(participantId).portfolioSyncedAt);
}
