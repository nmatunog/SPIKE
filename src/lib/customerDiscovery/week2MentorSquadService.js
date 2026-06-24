/**
 * Week 2 squad progress signals for mentor dashboard.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import { week2OverallProgressPct } from './week2MissionService.js';
import { MIN_ENCODED_INTERVIEWS } from './week2Constants.js';
import { isFecLabComplete } from './week2FecValidationService.js';
import { getSquadNameForParticipant } from './week2SquadEvidenceService.js';
import { getReadinessMissionState, deriveSquadDay3CoachMetrics } from './week2ReadinessMissionService.js';
import { getFecStudioState } from './week2FecStudioService.js';
import { getSquadIntelligenceBoard } from './week2DiscoveryService.js';

/** @param {string} participantId */
export function deriveMemberWeek2Signals(participantId) {
  const w2 = loadWeek2Discovery(participantId);
  const encoded = (w2.interviews ?? []).filter((i) => i.encoded).length;
  const mission = getReadinessMissionState(participantId);
  return {
    interviewCount: encoded,
    interviewsMet: encoded >= MIN_ENCODED_INTERVIEWS,
    portfolioComplete: Boolean(w2.portfolioSyncedAt),
    readinessComplete: Boolean(w2.professionalReadinessAt),
    reflectionApproved: Boolean(w2.readinessReflectionApprovedAt),
    uvpCheckpoint: w2.uvpCheckpointVerdict || '',
    thursdayReadinessPct: mission.readinessPct,
    reflectionSummary: w2.readinessReflectionSummary ?? '',
    pitchStarted: Boolean(w2.pitchStartedAt),
    pitchSubmitted: Boolean(w2.pitchSubmittedAt),
    exchangeDone: Boolean(w2.exchangeReflectionAt),
    synthesisDone: Boolean(w2.synthesisReviewedAt),
    weekProgressPct: week2OverallProgressPct(participantId),
  };
}

/**
 * @param {string[]} memberIds
 */
export function deriveSquadWeek2Progress(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) {
    return {
      memberCount: 0,
      interviewCount: 0,
      interviewsMet: false,
      portfolioComplete: false,
      readinessComplete: false,
      reflectionApproved: false,
      day3Metrics: null,
      day4Metrics: null,
      interviewIntelligence: null,
      pitchReady: false,
      pitchSubmitted: false,
      fecComplete: false,
      stageGateReady: false,
      weekProgressPct: 0,
    };
  }

  const signals = ids.map(deriveMemberWeek2Signals);
  const minInterviews = Math.min(...signals.map((s) => s.interviewCount));
  const all = (fn) => signals.every(fn);
  const day3 = deriveSquadDay3CoachMetrics(ids);
  const day4 = ids[0] ? (() => {
    const st = getFecStudioState(ids[0]);
    return {
      clarityScore: st.clarity.week2,
      pitchReady: Boolean(st.pitchSlides?.mission),
      buildReady: st.labComplete,
    };
  })() : null;
  const board = ids[0] ? getSquadIntelligenceBoard(ids[0]) : null;

  return {
    memberCount: ids.length,
    interviewCount: minInterviews,
    interviewsMet: all((s) => s.interviewsMet),
    portfolioComplete: all((s) => s.portfolioComplete),
    readinessComplete: all((s) => s.readinessComplete),
    reflectionApproved: all((s) => s.reflectionApproved),
    day3Metrics: day3,
    day4Metrics: day4,
    interviewIntelligence: board,
    pitchReady: all((s) => s.pitchStarted),
    pitchSubmitted: all((s) => s.pitchSubmitted),
    fecComplete: isFecLabComplete(getSquadNameForParticipant(memberIds[0] ?? '')),
    stageGateReady:
      isFecLabComplete(getSquadNameForParticipant(memberIds[0] ?? ''))
      && all((s) => s.interviewsMet && s.portfolioComplete && s.readinessComplete && s.pitchSubmitted),
    weekProgressPct: Math.round(
      signals.reduce((sum, s) => sum + s.weekProgressPct, 0) / signals.length,
    ),
  };
}
