/**
 * Week 2 squad progress signals for mentor dashboard.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import { week2OverallProgressPct } from './week2MissionService.js';
import { MIN_ENCODED_INTERVIEWS } from './week2Constants.js';

/** @param {string} participantId */
export function deriveMemberWeek2Signals(participantId) {
  const w2 = loadWeek2Discovery(participantId);
  const encoded = (w2.interviews ?? []).filter((i) => i.encoded).length;
  return {
    interviewCount: encoded,
    interviewsMet: encoded >= MIN_ENCODED_INTERVIEWS,
    portfolioComplete: Boolean(w2.portfolioSyncedAt),
    readinessComplete: Boolean(w2.professionalReadinessAt),
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
      pitchReady: false,
      pitchSubmitted: false,
      stageGateReady: false,
      weekProgressPct: 0,
    };
  }

  const signals = ids.map(deriveMemberWeek2Signals);
  const minInterviews = Math.min(...signals.map((s) => s.interviewCount));
  const all = (fn) => signals.every(fn);

  return {
    memberCount: ids.length,
    interviewCount: minInterviews,
    interviewsMet: all((s) => s.interviewsMet),
    portfolioComplete: all((s) => s.portfolioComplete),
    readinessComplete: all((s) => s.readinessComplete),
    pitchReady: all((s) => s.pitchStarted),
    pitchSubmitted: all((s) => s.pitchSubmitted),
    stageGateReady: all(
      (s) => s.interviewsMet && s.portfolioComplete && s.readinessComplete && s.pitchSubmitted,
    ),
    weekProgressPct: Math.round(
      signals.reduce((sum, s) => sum + s.weekProgressPct, 0) / signals.length,
    ),
  };
}
