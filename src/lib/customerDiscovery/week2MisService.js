/**
 * Market Intelligence Score (MIS) — credits on encode and milestones only.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import { MAX_INTERVIEW_QUESTIONS } from './week2Constants.js';

/** @param {string} participantId */
export function computeMisScore(participantId) {
  const state = loadWeek2Discovery(participantId);
  let score = 0;

  const validQuestions = (state.questions ?? []).filter((q) => String(q.text ?? '').trim().length > 8);
  if (validQuestions.length >= 3) score += 5;

  const encoded = (state.interviews ?? []).filter((i) => i.encoded);
  const count = encoded.length;
  if (count >= 1) score += 10;
  if (count >= 2) score += 10;
  if (count >= 3) score += 10;
  if (count >= 4) score += 15;
  if (count >= 5) score += 25;

  const hasReflection = (state.thinkingShifts ?? []).some((s) => String(s.response ?? '').trim().length > 10);
  if (hasReflection) score += 5;

  if (state.portfolioSyncedAt) score += 10;

  return Math.min(score, 100);
}

/** @param {string} participantId */
export function getMisBreakdown(participantId) {
  const state = loadWeek2Discovery(participantId);
  const encoded = (state.interviews ?? []).filter((i) => i.encoded).length;
  const questions = (state.questions ?? []).filter((q) => String(q.text ?? '').trim().length > 8).length;
  return {
    score: computeMisScore(participantId),
    encodedInterviews: encoded,
    questionCount: questions,
    maxQuestions: MAX_INTERVIEW_QUESTIONS,
    portfolioSynced: Boolean(state.portfolioSyncedAt),
    badges: {
      explorer: encoded >= 3,
      researcher: encoded >= 5,
    },
  };
}

/** @param {string} participantId */
export function getVentureStatus(participantId) {
  const mis = computeMisScore(participantId);
  const state = loadWeek2Discovery(participantId);
  const encoded = (state.interviews ?? []).filter((i) => i.encoded).length;
  const guideDone = Boolean(state.guideCompletedAt);
  const missionDone = Boolean(state.missionAcknowledged);

  let phase = 'Discovering Customers';
  let phaseColor = 'discover';
  let nextMilestone = 'Read your squad mission';
  let progress = 0;

  if (missionDone) progress += 15;
  if (guideDone) progress += 25;
  if (encoded >= 1) progress += 10;
  if (encoded >= 2) progress += 10;
  if (encoded >= 3) progress += 20;
  if (encoded >= 5) progress += 20;
  progress = Math.min(progress, 100);

  if (!missionDone) {
    nextMilestone = 'Read your squad mission';
  } else if (!guideDone) {
    nextMilestone = 'Design 5 interview questions';
  } else if (encoded < 3) {
    nextMilestone = `Encode ${3 - encoded} more interview${encoded === 2 ? '' : 's'}`;
  } else if (encoded < 5) {
    nextMilestone = 'Reach 5 interviews for full research depth';
    phase = 'Validating with Customers';
    phaseColor = 'validate';
  } else {
    nextMilestone = 'Submit for Stage Gate review';
    phase = 'Ready for Validation Gate';
    phaseColor = 'validate';
    progress = Math.max(progress, 85);
  }

  return {
    phase,
    phaseColor,
    nextMilestone,
    progress,
    mis,
    encodedInterviews: encoded,
  };
}
