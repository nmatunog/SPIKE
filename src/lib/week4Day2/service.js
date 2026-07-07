import {
  loadWeek4Day2Mission,
  saveWeek4Day2Mission,
  defaultWeek4Day2MissionState,
} from './storage.js';
import { finalizeWeek4Day2Blueprint } from './blueprintFinalize.js';

/** @param {string} participantId */
export function loadWeek4Day2MissionWithSuggestions(participantId) {
  return loadWeek4Day2Mission(participantId);
}

/** @param {import('./types.js').Week4Day2MissionState} state @param {number} step */
export function canCompleteWeek4Day2Step(state, step) {
  const d = state.drafts;
  switch (step) {
    case 1:
      return String(d.mission1.fiveXChallenge ?? '').trim().length >= 15;
    case 2:
      return (
        Boolean(d.mission2.stageId)
        && String(d.mission2.bottleneck ?? '').trim().length >= 15
        && String(d.mission2.solution ?? '').trim().length >= 15
        && String(d.mission2.expectedImpact ?? '').trim().length >= 10
      );
    case 3:
      return String(d.mission3.leadershipMultiplier ?? '').trim().length >= 10;
    default:
      return false;
  }
}

/** @param {string} participantId @param {import('./types.js').Week4Day2MissionState} state @param {number} step */
export function completeWeek4Day2Step(participantId, state, step) {
  if (!canCompleteWeek4Day2Step(state, step)) return null;

  if (step === 3) {
    finalizeWeek4Day2Blueprint(participantId, state.drafts);
  }

  const completedSteps = state.completedSteps.includes(step)
    ? state.completedSteps
    : [...state.completedSteps, step].sort((a, b) => a - b);

  const nextStep = step < 3 ? step + 1 : 3;
  const completedAt =
    completedSteps.length >= 3 ? new Date().toISOString() : state.completedAt;

  return saveWeek4Day2Mission(participantId, {
    ...state,
    completedSteps,
    currentStep: Math.min(nextStep, 3),
    completedAt,
  });
}

/** @param {string} participantId */
export function resetWeek4Day2MissionDraft(participantId) {
  return saveWeek4Day2Mission(participantId, defaultWeek4Day2MissionState(participantId));
}
