import { approveFecStep } from '../customerDiscovery/week2FecValidationService.js';
import { saveFecField, saveFecSummaryField } from '../fecCanvasService.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { WEEK4_GROWTH_ENGINE_GROUPS } from './missionConstants.js';

/** @param {string[]} items */
function bulletBlock(items) {
  return items.map((item) => `• ${item}`).join('\n');
}

/**
 * @param {import('./types.js').Week4Day1MissionDrafts['mission1']} draft
 */
export function finalizeMission1VentureProposition(participantId, draft) {
  const text = String(draft.finalProposition ?? '').trim();
  if (!text || text.length < 20) return false;

  saveFecSummaryField(participantId, { unified_venture_proposition: text });
  approveFecStep(participantId, 'fec-step-3', { approvedStatement: text, afterText: text });

  if (draft.propositionKind === 'tool' && draft.toolRelocatedTo.trim()) {
    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-advisor-startup',
      title: 'Tool relocated to Blueprint',
      content: `Technology/tool detail moved to: ${draft.toolRelocatedTo.trim()}`,
      sourceType: 'week4_day1_mission',
      sourceId: 'mission-1-tool-relocation',
    });
  }

  appendBlueprintTimelineEvent(participantId, {
    type: 'fec_finalized',
    title: 'Venture Proposition finalized',
    detail: text.slice(0, 120),
    week: 4,
    day: 1,
  });
  return true;
}

/**
 * @param {import('./types.js').Week4Day1MissionDrafts['mission2']} draft
 */
export function finalizeMission2ClientExperience(participantId, draft) {
  const journey = draft.journey ?? {};
  const journeyLines = [
    journey.discover ? `Discover — ${journey.discover}` : '',
    journey.plan ? `Plan — ${journey.plan}` : '',
    journey.protect ? `Protect — ${journey.protect}` : '',
    journey.review ? `Review — ${journey.review}` : '',
    journey.refer ? `Refer — ${journey.refer}` : '',
  ].filter(Boolean);

  const body = String(draft.clientExperience ?? '').trim();
  const combined = [body, journeyLines.length ? `\nJourney\n${journeyLines.join('\n')}` : '']
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!combined || combined.length < 30) return false;

  saveFecField(participantId, 'create_value', 'value_offering', combined);
  approveFecStep(participantId, 'fec-step-4', { approvedStatement: combined, afterText: combined });

  appendBlueprintTimelineEvent(participantId, {
    type: 'fec_finalized',
    title: 'Client Experience finalized (Box 4)',
    detail: combined.slice(0, 120),
    week: 4,
    day: 1,
  });
  return true;
}

/**
 * @param {import('./types.js').Week4Day1MissionDrafts['mission3']} draft
 */
export function finalizeMission3WinningStrategy(participantId, draft) {
  const text = String(draft.winningStrategy ?? '').trim();
  if (!text || text.length < 20) return false;

  saveFecField(participantId, 'agency_leadership', 'growth_multipliers', text);
  approveFecStep(participantId, 'fec-step-5', { approvedStatement: text, afterText: text });

  appendBlueprintTimelineEvent(participantId, {
    type: 'fec_finalized',
    title: 'Winning Strategy finalized (Box 5)',
    detail: text.slice(0, 120),
    week: 4,
    day: 1,
  });
  return true;
}

/**
 * @param {import('./types.js').Week4Day1MissionDrafts['mission4']} draft
 */
export function finalizeMission4GrowthEngines(participantId, draft) {
  const selected = draft.selected ?? {};
  const advisor = selected.advisorExcellence ?? [];
  const team = selected.teamLeadership ?? [];
  const systems = selected.systemsScale ?? [];

  if (!advisor.length && !team.length && !systems.length) return false;

  const advisorText = advisor.length
    ? `${WEEK4_GROWTH_ENGINE_GROUPS.advisorExcellence.label}\n${bulletBlock(advisor)}`
    : '';
  const teamText = team.length
    ? `${WEEK4_GROWTH_ENGINE_GROUPS.teamLeadership.label}\n${bulletBlock(team)}`
    : '';
  const systemsText = systems.length
    ? `${WEEK4_GROWTH_ENGINE_GROUPS.systemsScale.label}\n${bulletBlock(systems)}`
    : '';

  const summary = String(draft.summary ?? '').trim();
  const combined = [advisorText, teamText, systemsText, summary ? `Summary\n${summary}` : '']
    .filter(Boolean)
    .join('\n\n')
    .trim();

  saveFecField(participantId, 'create_value', 'channels', advisorText);
  saveFecField(participantId, 'agency_talent', 'talent_development_system', teamText);
  saveFecField(participantId, 'agency_leadership', 'expansion_strategy', systemsText);
  saveFecField(participantId, 'agency_talent', 'recruitment_channels', combined);

  appendBlueprintTimelineEvent(participantId, {
    type: 'fec_finalized',
    title: 'Growth Engines finalized (Box 6)',
    detail: combined.slice(0, 120),
    week: 4,
    day: 1,
  });
  return true;
}
