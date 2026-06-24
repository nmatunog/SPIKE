/**
 * Auto-sync Week 2 artifacts → Portfolio, Blueprint, timeline.
 */
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';
import { setSectionField } from '../blueprintSectionStore.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { resolveSquadMission, WEEK2_COHORT_NAME } from './week2Constants.js';
import { getCoachSummaryForMentor } from '../ventureCoachService.js';
import { getParticipantSquad } from '../cohortFormationService.js';
import { aggregateSquadIntelligence } from './week2InsightSynthesis.js';
import { squadEvidenceSummary } from './week2SquadEvidenceService.js';
import { loadFecValidation } from './week2FecValidationStorage.js';
import { isFecLabComplete } from './week2FecValidationService.js';

/** @param {string} participantId */
function squadNameFor(participantId) {
  return getParticipantSquad(participantId)?.name ?? '';
}

/** @param {string} participantId @param {string} [squadName] */
export function syncWeek2Day1Portfolio(participantId, squadName = '') {
  syncWeek2PortfolioArtifacts(participantId, squadName);
  const state = loadWeek2Discovery(participantId);
  if (state.portfolioSyncedAt) return state;
  return saveWeek2Discovery(participantId, { portfolioSyncedAt: new Date().toISOString() });
}

/**
 * Master sync — called after any Week 2 milestone.
 * @param {string} participantId
 * @param {string} [squadName]
 */
export function syncWeek2PortfolioArtifacts(participantId, squadName = '') {
  const state = loadWeek2Discovery(participantId);
  const mission = resolveSquadMission(squadName || squadNameFor(participantId));
  const coach = getCoachSummaryForMentor(participantId);
  const questions = (state.questions ?? [])
    .filter((q) => String(q.text ?? '').trim())
    .map((q, i) => `${i + 1}. ${q.text}`)
    .join('\n');
  const assumptions = (state.assumptions ?? [])
    .map((a) => `• ${a.belief ?? ''}`)
    .join('\n');
  const reflection = (state.thinkingShifts ?? []).map((s) => `**${s.prompt}**\n${s.response}`).join('\n\n');
  const preparedAt = new Date().toISOString().slice(0, 10);

  if (state.guideCompletedAt || state.missionAcknowledged) {
    const prepBody = [
      `# Week 2 Day 1 — Customer Discovery Preparation`,
      '',
      `**Cohort:** ${WEEK2_COHORT_NAME}`,
      `**Squad:** ${mission.squadKey}`,
      `**Customer Segment:** ${mission.marketSegment}`,
      '',
      '## Assumptions',
      assumptions || '_In progress_',
      '',
      '## Five Interview Questions',
      questions || '_In progress_',
      '',
      '## Field Research Plan',
      state.fieldResearchPlan || '_Pending_',
      '',
      '## Reflection',
      reflection || '_Pending_',
      '',
      `**Updated:** ${preparedAt}`,
    ].join('\n');

    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: 'Customer Discovery Preparation',
      content: prepBody,
      sourceType: 'week2-discovery',
      sourceId: 'day1-prep',
    });

    setSectionField(participantId, 'market-intelligence', 'customer_discovery_prep', prepBody, {
      sourceType: 'week2-discovery',
      sourceId: 'day1-prep',
    });
    setSectionField(participantId, 'market-intelligence', 'assigned_squad', mission.squadKey, {
      sourceType: 'week2-discovery',
    });
    setSectionField(participantId, 'market-intelligence', 'customer_segment', mission.marketSegment, {
      sourceType: 'week2-discovery',
    });
    setSectionField(participantId, 'market-intelligence', 'interview_questions', questions, {
      sourceType: 'week2-discovery',
    });
    setSectionField(participantId, 'market-intelligence', 'assumptions_list', assumptions, {
      sourceType: 'week2-discovery',
    });
    setSectionField(participantId, 'market-intelligence', 'field_research_plan', state.fieldResearchPlan ?? '', {
      sourceType: 'week2-discovery',
    });
    if (coach?.ambition) {
      setSectionField(participantId, 'market-intelligence', 'dream_connection', coach.ambition, {
        sourceType: 'week2-discovery',
      });
    }
  }

  const encoded = (state.interviews ?? []).filter((i) => i.encoded);
  if (encoded.length) {
    const interviewBody = encoded
      .map((iv, idx) => {
        const answers = (iv.answers ?? [])
          .map((a, i) => `Q${i + 1}: ${a}`)
          .join('\n');
        return [
          `### Interview ${idx + 1} — ${iv.alias || 'Customer'}`,
          `**Occupation:** ${iv.occupation || '—'}`,
          answers,
          iv.reflection ? `**Reflection:** ${iv.reflection}` : '',
        ].filter(Boolean).join('\n');
      })
      .join('\n\n---\n\n');

    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: `Field Interviews (${encoded.length})`,
      content: interviewBody,
      sourceType: 'week2-discovery',
      sourceId: 'interviews',
    });
    setSectionField(participantId, 'market-intelligence', 'encoded_interviews', interviewBody, {
      sourceType: 'week2-discovery',
    });
  }

  if (state.professionalReadinessAt || state.readinessReflectionApprovedAt) {
    const verdictLabel = {
      supported: '✓ Supported',
      refinement: '⚠ Needs Refinement',
      revision: '✗ Needs Revision',
    }[state.uvpCheckpointVerdict] ?? '—';

    const readinessBody = [
      '# Week 2 — Professional Readiness',
      '',
      '## PCTC Completion',
      state.readinessEvidenceNote || '_Completion recorded_',
      state.professionalReadinessAt
        ? `**Completed:** ${new Date(state.professionalReadinessAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`
        : '',
      state.readinessBadgeEarnedAt ? '**Badge:** Professional Readiness ✓' : '',
      '',
      '## Reflection Responses',
      state.readinessReflectionSurprised
        ? `**What surprised you?**\n${state.readinessReflectionSurprised}` : '',
      state.readinessReflectionResponsibility
        ? `**What responsibility stood out?**\n${state.readinessReflectionResponsibility}` : '',
      state.readinessReflectionTrustedAdvisor
        ? `**Trusted advisor?**\n${state.readinessReflectionTrustedAdvisor}` : '',
      '',
      '## Reflection Summary',
      state.readinessReflectionSummary
        || (state.thinkingShifts ?? [])
          .filter((s) => s.taskId === 'readiness-reflect')
          .map((s) => s.response)
          .join('\n')
        || '',
      '',
      '## UVP Checkpoint',
      state.uvpCheckpointOriginal ? `**Original UVP:** ${state.uvpCheckpointOriginal}` : '',
      state.uvpCheckpointVerdict ? `**Decision:** ${verdictLabel}` : '',
      state.uvpCheckpointNotes ? `**Notes:** ${state.uvpCheckpointNotes}` : '',
      state.uvpCheckpointAt
        ? `**Checkpoint:** ${new Date(state.uvpCheckpointAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`
        : '',
    ].filter(Boolean).join('\n');
    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: 'Professional Readiness',
      content: readinessBody,
      sourceType: 'week2-discovery',
      sourceId: 'readiness',
    });
    setSectionField(participantId, 'market-intelligence', 'professional_readiness', readinessBody, {
      sourceType: 'week2-discovery',
    });
    if (state.uvpCheckpointAt) {
      const uvpBody = [
        '# UVP Checkpoint — Week 2 Day 3',
        '',
        `**Original UVP:** ${state.uvpCheckpointOriginal || '—'}`,
        `**Decision:** ${verdictLabel}`,
        state.uvpCheckpointNotes ? `**Why:** ${state.uvpCheckpointNotes}` : '',
        `**Timestamp:** ${state.uvpCheckpointAt}`,
      ].join('\n');
      createPortfolioArtifactDraft({
        participantId,
        sectionId: 'portfolio-market-intelligence',
        title: 'UVP Checkpoint',
        content: uvpBody,
        sourceType: 'week2-discovery',
        sourceId: 'uvp-checkpoint',
      });
      setSectionField(participantId, 'market-intelligence', 'uvp_checkpoint', uvpBody, {
        sourceType: 'week2-discovery',
      });
    }
  }

  const board = aggregateSquadIntelligence(state.interviews ?? []);
  if (state.intelligenceBoardAt) {
    const boardBody = [
      '# Squad Intelligence Board',
      '',
      `**Interviews encoded:** ${board.interviewCount}`,
      '',
      '## Most Common Goals',
      ...board.mostCommonGoals.map((g) => `- ${g}`),
      '',
      '## Most Common Challenges',
      ...board.mostCommonChallenges.map((c) => `- ${c}`),
      '',
      '## Customer Quotes',
      ...board.mostCommonQuotes.map((q) => `> ${q}`),
      '',
      '## Discussion Notes',
      state.squadDiscussionNotes || '_—_',
    ].join('\n');
    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: 'Squad Intelligence Board',
      content: boardBody,
      sourceType: 'week2-discovery',
      sourceId: 'intelligence-board',
    });
    setSectionField(participantId, 'market-intelligence', 'squad_intelligence_board', boardBody, {
      sourceType: 'week2-discovery',
    });
  }

  if (state.pitchStartedAt) {
    const squadKey = squadName || squadNameFor(participantId);
    const fec = loadFecValidation(squadKey);
    const slides = fec.pitchSlides ?? {};
    const p = state.pitchOutline ?? {};
    const pitchBody = [
      '# Market Validation Pitch',
      '',
      `## Mission\n${slides.mission || p.mission}`,
      `## Who We Interviewed\n${slides.whoInterviewed || p.whoInterviewed}`,
      `## What We Thought\n${slides.whatWeThought || p.whatWeThought}`,
      `## What We Heard\n${slides.whatWeHeard || p.whatWeLearned}`,
      `## Customer Voices\n${slides.customerVoices || p.customerVoices}`,
      `## What Changed\n${slides.whatChanged || slides.validatedProblem || ''}`,
      `## FEC Before\n${slides.fecBefore || slides.uvpBefore || ''}`,
      `## FEC After\n${slides.fecAfter || slides.uvpAfter || ''}`,
      `## Strategic Opportunity\n${slides.strategicOpportunity || p.ventureChanged}`,
      `## Next Step\n${slides.nextStep || p.nextSteps}`,
    ].join('\n\n');
    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: 'Market Validation Pitch',
      content: pitchBody,
      sourceType: 'week2-discovery',
      sourceId: 'validation-pitch',
    });
    setSectionField(participantId, 'market-intelligence', 'validation_pitch', pitchBody, {
      sourceType: 'week2-discovery',
    });
  }

  const squadKey = squadName || squadNameFor(participantId);
  if (isFecLabComplete(squadKey)) {
    const fec = loadFecValidation(squadKey);
    const evidence = squadEvidenceSummary(participantId);
    const clarityWeek1 = Math.round(
      Object.values(fec.boxScores ?? {}).reduce((s, b) => s + (b.before ?? 0), 0)
      / Math.max(1, Object.keys(fec.boxScores ?? {}).length),
    );
    const clarityWeek2 = Math.round(
      Object.values(fec.boxScores ?? {}).reduce((s, b) => s + (b.after ?? 0), 0)
      / Math.max(1, Object.keys(fec.boxScores ?? {}).length),
    );
    const report = fec.ventureEvolutionReport ?? {};
    const marketEvidenceBody = [
      '# Week 2 — FEC Validation Evidence',
      '',
      `**Squad:** ${evidence.squadName}`,
      `**Interviews:** ${evidence.interviewCount}`,
      `**Canvas Clarity:** ${clarityWeek1}% → ${clarityWeek2}%`,
      '',
      '## Evidence Board',
      fec.evidenceBoard?.marketSummary?.values ?? '',
      fec.evidenceBoard?.marketSummary?.struggles ?? '',
      fec.evidenceBoard?.marketSummary?.needs ?? '',
      '',
      '## Customer Segment Summary',
      fec.steps['fec-step-1']?.approvedStatement ?? '',
      '',
      '## Validated Problem',
      fec.steps['fec-step-2']?.approvedStatement ?? '',
      '',
      '## UVP Evolution',
      `Before: ${fec.steps['fec-step-3']?.beforeText ?? ''}`,
      `After: ${fec.steps['fec-step-3']?.afterText ?? fec.steps['fec-step-3']?.approvedStatement ?? ''}`,
      '',
      '## Client Experience',
      fec.steps['fec-step-4']?.approvedStatement ?? '',
      '',
      '## Strategic Opportunity',
      fec.steps['fec-step-5']?.approvedStatement ?? '',
      '',
      '## Venture Evolution Report',
      report.topInsight ? `**Insight:** ${report.topInsight}` : '',
      report.biggestOpportunity ? `**Opportunity:** ${report.biggestOpportunity}` : '',
      '',
      '## Next Experiment',
      fec.nextExperiment ?? '',
      '',
      '## Week 3 Build Direction',
      fec.week3BuildDirection ?? '',
      '',
      '## Build Readiness',
      fec.buildReadiness ?? '',
      '',
      '## FEC Confidence Scores',
      ...Object.entries(fec.boxScores ?? {}).map(([k, v]) => `- ${k}: ${v.before}% → ${v.after}% (${v.status})`),
    ].join('\n');
    createPortfolioArtifactDraft({
      participantId,
      sectionId: 'portfolio-market-intelligence',
      title: 'Market Validation Evidence',
      content: marketEvidenceBody,
      sourceType: 'week2-fec-validation',
      sourceId: 'market-evidence',
    });
    setSectionField(participantId, 'market-intelligence', 'market_validation_evidence', marketEvidenceBody, {
      sourceType: 'week2-fec-validation',
    });
  }

  appendBlueprintTimelineEvent(participantId, {
    type: 'week2_discovery',
    title: 'Week 2 · Research studio updated',
    module: 'customer-discovery',
    sourceType: 'week2-discovery',
    sourceId: 'sync',
  });

  return state;
}

/** @param {string} participantId */
export function isWeek2PortfolioSynced(participantId) {
  return Boolean(loadWeek2Discovery(participantId).portfolioSyncedAt);
}
